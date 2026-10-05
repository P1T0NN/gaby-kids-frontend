/// <reference types="vite/client" />

import aggregateTest from '@convex-dev/aggregate/test';
import rateLimiterTest from '@convex-dev/rate-limiter/test';
import resendTest from '@convex-dev/resend/test';
import { convexTest } from 'convex-test';
import auditLogTest from 'convex-audit-log/test';
import { expect, test, vi } from 'vitest';

import { api, internal } from '../../src/convex/_generated/api';
import schema from '../../src/convex/schema';
import * as emailService from '../../src/convex/emails/sendEmail';

// TYPES
import type { Id } from '../../src/convex/_generated/dataModel';

const modules = import.meta.glob('../../src/convex/**/*.ts');

const CUSTOMER_REF = '00000000-0000-4000-8000-000000000001';

const saveCoupon = api.tables.coupons.mutations.saveCoupon.saveCoupon;
const setCouponActive = api.tables.coupons.mutations.setCouponActive.setCouponActive;
const deleteCoupon = api.tables.coupons.mutations.deleteCoupon.deleteCoupon;
const fetchCouponsAdmin = api.tables.coupons.queries.fetchCouponsAdmin.fetchCouponsAdmin;
const validateCoupon = api.tables.coupons.queries.validateCoupon.validateCoupon;
const createCheckoutReservation =
	internal.tables.checkoutReservations.mutations.createCheckoutReservation
		.createCheckoutReservation;
const associateStripeCheckoutSession =
	internal.tables.checkoutReservations.mutations.associateStripeCheckoutSession
		.associateStripeCheckoutSession;
const completeCheckoutReservation =
	internal.tables.checkoutReservations.mutations.completeCheckoutReservation
		.completeCheckoutReservation;

function createTestContext() {
	const t = convexTest(schema, modules);
	aggregateTest.register(t, 'productsAggregate');
	aggregateTest.register(t, 'categoriesAggregate');
	aggregateTest.register(t, 'ordersAggregate');
	rateLimiterTest.register(t);
	resendTest.register(t);
	auditLogTest.register(t);
	return t;
}

/** One active product with a single untracked product variant to reserve against. */
async function insertProductVariantFixture(
	t: ReturnType<typeof createTestContext>,
	priceInCents: number
): Promise<Id<'productVariants'>> {
	return t.run(async (ctx) => {
		const categoryId = await ctx.db.insert('categories', {
			name: 'Coupons category',
			slug: 'coupons-category',
			status: 'active'
		});
		const productId = await ctx.db.insert('products', {
			name: 'Coupon product',
			slug: 'coupon-product',
			description: 'Coupon product description',
			priceInCents,
			categoryId,
			imageKeys: [],
			storagePrefix: 'products',
			trackInventory: false,
			productVariantOptionNames: [],
			hasPriceRange: false,
			upsellProductIds: [],
			status: 'active'
		});
		return ctx.db.insert('productVariants', {
			productId,
			position: 0,
			options: [],
			sku: 'coupon-product-sku',
			imageKeys: [],
			priceInCents,
			inventory: 0,
			reservedInventory: 0
		});
	});
}

function paidEvent(
	stripeCheckoutSessionId: string,
	stripePaymentIntentId: string,
	totalInCents: number,
	currency: string
) {
	return {
		eventType: 'checkout.session.completed' as const,
		eventCreatedAt: 2000,
		stripeCheckoutSessionId,
		stripePaymentIntentId,
		checkoutStatus: 'complete' as const,
		paymentStatus: 'paid' as const,
		currency: currency.toLowerCase(),
		totalInCents
	};
}

test('admin creates a normalized coupon and the checkout preview prices it', async () => {
	const t = createTestContext();
	const admin = t.withIdentity({
		subject: 'admin',
		tokenIdentifier: 'issuer|admin',
		role: 'admin'
	});
	await insertProductVariantFixture(t, 2000);

	const couponId = await admin.mutation(saveCoupon, {
		name: 'Launch',
		code: ' launch10 ',
		percentOff: 10,
		active: true,
		onePerCustomer: false,
		minSubtotalInCents: 1000
	});
	const preview = await t.query(validateCoupon, {
		code: 'launch10',
		subtotalInCents: 2000,
		customerRef: CUSTOMER_REF
	});
	expect(preview).toMatchObject({
		couponId,
		code: 'LAUNCH10',
		percentOff: 10,
		discountInCents: 200
	});

	await expect(
		admin.mutation(saveCoupon, {
			name: 'Duplicate',
			code: 'LAUNCH10',
			percentOff: 5,
			active: true,
			onePerCustomer: false
		})
	).rejects.toMatchObject({ data: { code: 'COUPON_CODE_TAKEN' } });

	const page = await admin.query(fetchCouponsAdmin, {
		paginationOpts: { numItems: 10, cursor: null }
	});
	expect(page.items.map((coupon) => coupon.code)).toEqual(['LAUNCH10']);
	expect(page.items[0]).toMatchObject({ minSubtotalInCents: 1000, redemptionCount: 0 });

	await expect(
		t.query(validateCoupon, {
			code: 'LAUNCH10',
			subtotalInCents: 999,
			customerRef: CUSTOMER_REF
		})
	).rejects.toMatchObject({
		data: { code: 'COUPON_MIN_SUBTOTAL', minSubtotalInCents: 1000 }
	});

	await admin.mutation(setCouponActive, { couponId, active: false });
	await expect(
		t.query(validateCoupon, {
			code: 'LAUNCH10',
			subtotalInCents: 2000,
			customerRef: CUSTOMER_REF
		})
	).rejects.toMatchObject({ data: { code: 'COUPON_INACTIVE' } });

	await admin.mutation(deleteCoupon, { couponId });
	await expect(
		t.query(validateCoupon, {
			code: 'LAUNCH10',
			subtotalInCents: 2000,
			customerRef: CUSTOMER_REF
		})
	).rejects.toMatchObject({ data: { code: 'COUPON_NOT_FOUND' } });
});

test('coupon reservations discount the total and completion records one redemption', async () => {
	const emails = vi.spyOn(emailService, 'sendEmail');
	try {
		const t = createTestContext();
		const productVariantId = await insertProductVariantFixture(t, 2500);
		const couponId = await t.run((ctx) =>
			ctx.db.insert('coupons', {
				name: 'Ten percent',
				code: 'TEN',
				percentOff: 10,
				active: true,
				onePerCustomer: false,
				redemptionCount: 0
			})
		);

		const reservation = await t.mutation(createCheckoutReservation, {
			customerRef: CUSTOMER_REF,
			receiptToken: 'coupon-receipt',
			items: [{ productVariantId, quantity: 2 }],
			firstName: 'Ada',
			lastName: 'Lovelace',
			email: 'ada@example.com',
			phone: '123',
			fulfillmentMethod: 'pickup',
			couponCode: 'ten'
		});
		expect(reservation.checkout).toMatchObject({
			couponId,
			couponCode: 'TEN',
			subtotalInCents: 5000,
			discountInCents: 500,
			totalInCents: 4500
		});

		await t.mutation(associateStripeCheckoutSession, {
			reservationId: reservation.reservationId,
			stripeCheckoutSessionId: 'cs_coupon',
			expiresAt: reservation.expiresAt
		});
		const args = {
			reservationId: reservation.reservationId,
			checkout: reservation.checkout,
			payment: paidEvent(
				'cs_coupon',
				'pi_coupon',
				reservation.checkout.totalInCents,
				reservation.checkout.currency
			)
		};
		const orderId = await t.mutation(completeCheckoutReservation, args);
		const replayedOrderId = await t.mutation(completeCheckoutReservation, args);

		expect(replayedOrderId).toBe(orderId);
		expect(orderId).not.toBeNull();
		await t.run(async (ctx) => {
			const order = orderId ? await ctx.db.get(orderId) : null;
			expect(order).toMatchObject({
				couponId,
				couponCode: 'TEN',
				discountInCents: 500,
				subtotalInCents: 5000,
				totalInCents: 4500
			});
			expect(await ctx.db.get(couponId)).toMatchObject({ redemptionCount: 1 });
		});
	} finally {
		emails.mockRestore();
	}
});

test('one-per-customer coupons reject a second redemption but allow another customer', async () => {
	const emails = vi.spyOn(emailService, 'sendEmail');
	try {
		const t = createTestContext();
		const productVariantId = await insertProductVariantFixture(t, 2000);
		const couponId = await t.run((ctx) =>
			ctx.db.insert('coupons', {
				name: 'Once',
				code: 'ONCE',
				percentOff: 20,
				active: true,
				onePerCustomer: true,
				redemptionCount: 0
			})
		);

		const reservation = await t.mutation(createCheckoutReservation, {
			customerRef: CUSTOMER_REF,
			receiptToken: 'once-receipt',
			items: [{ productVariantId, quantity: 1 }],
			firstName: 'Ada',
			lastName: 'Lovelace',
			email: 'ada@example.com',
			phone: '123',
			fulfillmentMethod: 'pickup',
			couponCode: 'ONCE'
		});
		await t.mutation(associateStripeCheckoutSession, {
			reservationId: reservation.reservationId,
			stripeCheckoutSessionId: 'cs_once',
			expiresAt: reservation.expiresAt
		});
		await t.mutation(completeCheckoutReservation, {
			reservationId: reservation.reservationId,
			checkout: reservation.checkout,
			payment: paidEvent(
				'cs_once',
				'pi_once',
				reservation.checkout.totalInCents,
				reservation.checkout.currency
			)
		});

		await expect(
			t.query(validateCoupon, {
				code: 'ONCE',
				subtotalInCents: 2000,
				customerRef: CUSTOMER_REF
			})
		).rejects.toMatchObject({ data: { code: 'COUPON_ALREADY_USED' } });
		await expect(
			t.mutation(createCheckoutReservation, {
				// A rotated device id is still caught by the checkout email.
				customerRef: '00000000-0000-4000-8000-000000000002',
				receiptToken: 'once-again-receipt',
				items: [{ productVariantId, quantity: 1 }],
				firstName: 'Ada',
				lastName: 'Lovelace',
				email: 'ada@example.com',
				phone: '123',
				fulfillmentMethod: 'pickup',
				couponCode: 'ONCE'
			})
		).rejects.toMatchObject({ data: { code: 'COUPON_ALREADY_USED' } });

		const otherCustomer = await t.query(validateCoupon, {
			code: 'ONCE',
			subtotalInCents: 2000,
			customerRef: '00000000-0000-4000-8000-000000000002',
			email: 'grace@example.com'
		});
		expect(otherCustomer.discountInCents).toBe(400);
		expect(await t.run((ctx) => ctx.db.get(couponId))).toMatchObject({ redemptionCount: 1 });
	} finally {
		emails.mockRestore();
	}
});

test('expired, usage-limited, and tiny-subtotal coupons stay payable', async () => {
	const t = createTestContext();
	const productVariantId = await insertProductVariantFixture(t, 2);
	const insertCoupon = (overrides: {
		code: string;
		percentOff: number;
		expiresAt?: number;
		maxRedemptions?: number;
		redemptionCount?: number;
	}) =>
		t.run((ctx) =>
			ctx.db.insert('coupons', {
				name: overrides.code,
				code: overrides.code,
				percentOff: overrides.percentOff,
				active: true,
				onePerCustomer: false,
				expiresAt: overrides.expiresAt,
				maxRedemptions: overrides.maxRedemptions,
				redemptionCount: overrides.redemptionCount ?? 0
			})
		);

	await insertCoupon({ code: 'STALE', percentOff: 10, expiresAt: Date.now() - 1000 });
	await expect(
		t.query(validateCoupon, { code: 'STALE', subtotalInCents: 1000, customerRef: CUSTOMER_REF })
	).rejects.toMatchObject({ data: { code: 'COUPON_EXPIRED' } });

	await insertCoupon({ code: 'USEDUP', percentOff: 10, maxRedemptions: 1, redemptionCount: 1 });
	await expect(
		t.query(validateCoupon, { code: 'USEDUP', subtotalInCents: 1000, customerRef: CUSTOMER_REF })
	).rejects.toMatchObject({ data: { code: 'COUPON_USAGE_LIMIT_REACHED' } });

	await insertCoupon({ code: 'ALMOSTFREE', percentOff: 99 });
	const reservation = await t.mutation(createCheckoutReservation, {
		customerRef: CUSTOMER_REF,
		receiptToken: 'tiny-receipt',
		items: [{ productVariantId, quantity: 1 }],
		firstName: 'Ada',
		lastName: 'Lovelace',
		email: 'ada@example.com',
		phone: '123',
		fulfillmentMethod: 'pickup',
		couponCode: 'ALMOSTFREE'
	});
	expect(reservation.checkout).toMatchObject({
		subtotalInCents: 2,
		discountInCents: 1,
		totalInCents: 1
	});
});
