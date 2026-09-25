/// <reference types="vite/client" />

import aggregateTest from '@convex-dev/aggregate/test';
import resendTest from '@convex-dev/resend/test';
import { convexTest } from 'convex-test';
import { expect, test, vi } from 'vitest';

import { internal } from '../../src/convex/_generated/api';
import schema from '../../src/convex/schema';
import * as emailService from '../../src/convex/emails/sendEmail';

// TYPES
import type { Id } from '../../src/convex/_generated/dataModel';

// CONFIG
import { ORDER_CONFIG } from '../../src/shared/features/orders/config';

const modules = import.meta.glob('../../src/convex/**/*.ts');

const CUSTOMER_REF = '00000000-0000-4000-8000-000000000001';

const createCheckoutReservation =
	internal.tables.checkoutReservations.mutations.createCheckoutReservation
		.createCheckoutReservation;
const associateStripeCheckoutSession =
	internal.tables.checkoutReservations.mutations.associateStripeCheckoutSession
		.associateStripeCheckoutSession;
const releaseCheckoutReservation =
	internal.tables.checkoutReservations.mutations.releaseCheckoutReservation
		.releaseCheckoutReservation;
const deleteExpiredCheckoutReservationsCron =
	internal.tables.checkoutReservations.crons.deleteExpiredCheckoutReservationsCron
		.deleteExpiredCheckoutReservationsCron;
const completeCheckoutReservation =
	internal.tables.checkoutReservations.mutations.completeCheckoutReservation
		.completeCheckoutReservation;

function createTestContext() {
	const t = convexTest(schema, modules);
	aggregateTest.register(t, 'productsAggregate');
	aggregateTest.register(t, 'categoriesAggregate');
	aggregateTest.register(t, 'ordersAggregate');
	resendTest.register(t);
	return t;
}

type ProductVariantFixture = {
	name: string;
	slug: string;
	priceInCents: number;
	trackInventory: boolean;
	inventory: number;
};

/** One active product with a single product variant to reserve against. */
async function insertProductVariantFixture(
	t: ReturnType<typeof createTestContext>,
	fixture: ProductVariantFixture
): Promise<{ productId: Id<'products'>; productVariantId: Id<'productVariants'> }> {
	return t.run(async (ctx) => {
		const categoryId = await ctx.db.insert('categories', {
			name: `${fixture.name} category`,
			slug: `${fixture.slug}-category`,
			status: 'active'
		});
		const productId = await ctx.db.insert('products', {
			name: fixture.name,
			slug: fixture.slug,
			description: `${fixture.name} description`,
			priceInCents: fixture.priceInCents,
			categoryId,
			images: [],
			imageKeys: [],
			storagePrefix: 'products',
			trackInventory: fixture.trackInventory,
			productVariantOptionNames: [],
			hasPriceRange: false,
			upsellProductIds: [],
			status: 'active'
		});
		const productVariantId = await ctx.db.insert('productVariants', {
			productId,
			position: 0,
			options: [],
			sku: `${fixture.slug}-sku`,
			imageKeys: [],
			priceInCents: fixture.priceInCents,
			inventory: fixture.inventory,
			reservedInventory: 0
		});

		return { productId, productVariantId };
	});
}

function paidEvent(
	stripeCheckoutSessionId: string,
	stripePaymentIntentId: string,
	totalInCents: number,
	currency: string,
	eventCreatedAt = 2000
) {
	return {
		eventType: 'checkout.session.completed' as const,
		eventCreatedAt,
		stripeCheckoutSessionId,
		stripePaymentIntentId,
		checkoutStatus: 'complete' as const,
		paymentStatus: 'paid' as const,
		currency: currency.toLowerCase(),
		totalInCents
	};
}

test('reserves tracked stock and stores a trusted immutable checkout snapshot', async () => {
	vi.useFakeTimers();
	try {
		const now = new Date('2026-09-16T12:00:00Z');
		vi.setSystemTime(now);
		const t = createTestContext();
		const tracked = await insertProductVariantFixture(t, {
			name: 'Tracked',
			slug: 'tracked',
			priceInCents: 1250,
			trackInventory: true,
			inventory: 3
		});
		const untracked = await insertProductVariantFixture(t, {
			name: 'Unlimited',
			slug: 'unlimited',
			priceInCents: 500,
			trackInventory: false,
			inventory: 0
		});
		const buyer = t.withIdentity({ subject: 'buyer', tokenIdentifier: 'issuer|buyer' });
		const reservation = await buyer.mutation(createCheckoutReservation, {
			customerRef: CUSTOMER_REF,
			receiptToken: 'reservation-receipt',
			items: [
				{ productVariantId: tracked.productVariantId, quantity: 1 },
				{ productVariantId: tracked.productVariantId, quantity: 1 },
				{ productVariantId: untracked.productVariantId, quantity: 99 }
			],
			firstName: 'Ada',
			lastName: 'Lovelace',
			email: 'ADA@example.com',
			phone: '123',
			fulfillmentMethod: 'pickup'
		});

		expect(reservation.expiresAt).toBe(now.getTime() + 30 * 60_000);
		expect(reservation.checkout).toMatchObject({
			customerId: 'buyer',
			email: 'ada@example.com',
			totalInCents: 52_000
		});
		expect(reservation.checkout.items).toEqual(
			expect.arrayContaining([
				{
					productId: tracked.productId,
					productVariantId: tracked.productVariantId,
					name: 'Tracked',
					productVariantLabel: '',
					sku: 'tracked-sku',
					quantity: 2,
					unitPriceInCents: 1250,
					imageUrl: ''
				},
				{
					productId: untracked.productId,
					productVariantId: untracked.productVariantId,
					name: 'Unlimited',
					productVariantLabel: '',
					sku: 'unlimited-sku',
					quantity: 99,
					unitPriceInCents: 500,
					imageUrl: ''
				}
			])
		);
		expect(reservation.checkout.items[0]).not.toHaveProperty('trackInventory');

		await t.run(async (ctx) => {
			expect(await ctx.db.get(tracked.productVariantId)).toMatchObject({ reservedInventory: 2 });
			expect(await ctx.db.get(untracked.productVariantId)).toMatchObject({
				reservedInventory: 0
			});
			const stored = await ctx.db.get(reservation.reservationId);
			expect(stored).toMatchObject({ status: 'active' });
			expect(stored).not.toHaveProperty('checkout');
			expect(stored).not.toHaveProperty('receiptToken');
			expect(stored).not.toHaveProperty('email');
			expect(stored?.items.every((item) => !('imageUrl' in item))).toBe(true);
			expect(stored?.items).toEqual(
				expect.arrayContaining([
					{
						productId: tracked.productId,
						productVariantId: tracked.productVariantId,
						name: 'Tracked',
						productVariantLabel: '',
						sku: 'tracked-sku',
						unitPriceInCents: 1250,
						quantity: 2,
						trackInventory: true
					},
					{
						productId: untracked.productId,
						productVariantId: untracked.productVariantId,
						name: 'Unlimited',
						productVariantLabel: '',
						sku: 'unlimited-sku',
						unitPriceInCents: 500,
						quantity: 99,
						trackInventory: false
					}
				])
			);
			await ctx.db.patch(tracked.productId, { name: 'Changed' });
			await ctx.db.patch(tracked.productVariantId, { priceInCents: 9999 });
			const snapshot = (await ctx.db.get(reservation.reservationId))?.items.find(
				(item) => item.productVariantId === tracked.productVariantId
			);
			expect(snapshot).toMatchObject({
				name: 'Tracked',
				unitPriceInCents: 1250
			});
			expect(await ctx.db.query('orders').take(1)).toEqual([]);
			expect(await ctx.db.query('orderItems').take(1)).toEqual([]);
		});
		expect(
			await t.mutation(releaseCheckoutReservation, {
				reservationId: reservation.reservationId
			})
		).toBe(true);
		await t.run(async (ctx) => {
			expect(await ctx.db.get(tracked.productVariantId)).toMatchObject({ reservedInventory: 0 });
			expect(await ctx.db.get(untracked.productVariantId)).toMatchObject({
				reservedInventory: 0
			});
		});
	} finally {
		vi.useRealTimers();
	}
});

test('delivery reservations add the flat shipping fee below the free-shipping threshold', async () => {
	const t = createTestContext();
	const { productVariantId } = await insertProductVariantFixture(t, {
		name: 'Delivery product',
		slug: 'delivery-product',
		priceInCents: 1000,
		trackInventory: false,
		inventory: 0
	});
	const reservation = await t.mutation(createCheckoutReservation, {
		customerRef: CUSTOMER_REF,
		receiptToken: 'delivery-receipt',
		items: [{ productVariantId, quantity: 1 }],
		firstName: 'Ada',
		lastName: 'Lovelace',
		email: 'ada@example.com',
		phone: '123',
		fulfillmentMethod: 'delivery',
		shippingAddress: { street: 'Street', city: 'City', postalCode: '123', country: 'US' }
	});

	expect(reservation.checkout).toMatchObject({
		subtotalInCents: 1000,
		shippingInCents: ORDER_CONFIG.shippingFeeInCents,
		totalInCents: 1000 + ORDER_CONFIG.shippingFeeInCents
	});
});

test('competing reservations cannot oversell tracked product variant inventory', async () => {
	const t = createTestContext();
	const { productVariantId } = await insertProductVariantFixture(t, {
		name: 'Last item',
		slug: 'only-one',
		priceInCents: 1000,
		trackInventory: true,
		inventory: 1
	});
	const input = {
		items: [{ productVariantId, quantity: 1 }],
		firstName: 'Ada',
		lastName: 'Lovelace',
		email: 'ada@example.com',
		phone: '123',
		fulfillmentMethod: 'pickup' as const
	};
	const results = await Promise.allSettled([
		t.mutation(createCheckoutReservation, {
			...input,
			customerRef: CUSTOMER_REF,
			receiptToken: 'first'
		}),
		t.mutation(createCheckoutReservation, {
			...input,
			customerRef: CUSTOMER_REF,
			receiptToken: 'second'
		})
	]);

	expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
	const rejected = results.find((result) => result.status === 'rejected');
	expect(rejected?.reason).toMatchObject({ data: { code: 'ORDER_PRODUCT_UNAVAILABLE' } });
	await t.run(async (ctx) => {
		expect(await ctx.db.get(productVariantId)).toMatchObject({ reservedInventory: 1 });
		expect(await ctx.db.query('checkoutReservations').take(2)).toHaveLength(1);
	});
});

test('rejects a reservation when tracked product variant inventory is zero', async () => {
	const t = createTestContext();
	const { productVariantId } = await insertProductVariantFixture(t, {
		name: 'Sold out',
		slug: 'sold-out-item',
		priceInCents: 1000,
		trackInventory: true,
		inventory: 0
	});
	await expect(
		t.mutation(createCheckoutReservation, {
			customerRef: CUSTOMER_REF,
			receiptToken: 'sold-out-reservation',
			items: [{ productVariantId, quantity: 1 }],
			firstName: 'Ada',
			lastName: 'Lovelace',
			email: 'ada@example.com',
			phone: '123',
			fulfillmentMethod: 'pickup'
		})
	).rejects.toMatchObject({ data: { code: 'ORDER_PRODUCT_UNAVAILABLE' } });
	await t.run(async (ctx) => {
		expect(await ctx.db.get(productVariantId)).toMatchObject({
			inventory: 0,
			reservedInventory: 0
		});
		expect(await ctx.db.query('checkoutReservations').take(1)).toEqual([]);
	});
});

test('association, release, and expiration cleanup are idempotent', async () => {
	vi.useFakeTimers();
	try {
		const now = new Date('2026-09-16T12:00:00Z');
		vi.setSystemTime(now);
		const t = createTestContext();
		const { productVariantId } = await insertProductVariantFixture(t, {
			name: 'Lifecycle product',
			slug: 'lifecycle-product',
			priceInCents: 1000,
			trackInventory: true,
			inventory: 4
		});
		const input = {
			items: [{ productVariantId, quantity: 1 }],
			firstName: 'Ada',
			lastName: 'Lovelace',
			email: 'ada@example.com',
			phone: '123',
			fulfillmentMethod: 'pickup' as const
		};
		const first = await t.mutation(createCheckoutReservation, {
			...input,
			customerRef: CUSTOMER_REF,
			receiptToken: 'first'
		});
		const second = await t.mutation(createCheckoutReservation, {
			...input,
			customerRef: CUSTOMER_REF,
			receiptToken: 'second',
			items: [{ productVariantId, quantity: 2 }]
		});
		const firstAssociation = {
			reservationId: first.reservationId,
			stripeCheckoutSessionId: 'cs_first',
			expiresAt: first.expiresAt
		};
		expect(await t.mutation(associateStripeCheckoutSession, firstAssociation)).toBe(
			first.reservationId
		);
		expect(await t.mutation(associateStripeCheckoutSession, firstAssociation)).toBe(
			first.reservationId
		);
		await expect(
			t.mutation(associateStripeCheckoutSession, {
				...firstAssociation,
				reservationId: second.reservationId
			})
		).rejects.toMatchObject({ data: { code: 'CHECKOUT_RESERVATION_CONFLICT' } });
		await expect(
			t.mutation(associateStripeCheckoutSession, {
				...firstAssociation,
				stripeCheckoutSessionId: 'cs_other'
			})
		).rejects.toMatchObject({ data: { code: 'CHECKOUT_RESERVATION_CONFLICT' } });

		expect(
			await t.mutation(releaseCheckoutReservation, { reservationId: first.reservationId })
		).toBe(true);
		expect(
			await t.mutation(releaseCheckoutReservation, { reservationId: first.reservationId })
		).toBe(false);
		await expect(
			t.mutation(associateStripeCheckoutSession, firstAssociation)
		).rejects.toMatchObject({
			data: { code: 'CHECKOUT_RESERVATION_CONFLICT' }
		});
		expect(await t.run((ctx) => ctx.db.get(productVariantId))).toMatchObject({
			reservedInventory: 2
		});

		vi.setSystemTime(new Date(now.getTime() + 31 * 60_000));
		expect(await t.mutation(deleteExpiredCheckoutReservationsCron, {})).toBe(1);
		expect(await t.mutation(deleteExpiredCheckoutReservationsCron, {})).toBe(0);
		await t.run(async (ctx) => {
			expect(await ctx.db.get(productVariantId)).toMatchObject({ reservedInventory: 0 });
			expect(await ctx.db.get(first.reservationId)).toMatchObject({ status: 'released' });
			expect(await ctx.db.get(second.reservationId)).toMatchObject({ status: 'released' });
		});
	} finally {
		vi.useRealTimers();
	}
});

test('completes one paid reservation exactly once and skips untracked inventory', async () => {
	const emails = vi.spyOn(emailService, 'sendEmail');
	try {
		const t = createTestContext();
		const tracked = await insertProductVariantFixture(t, {
			name: 'Tracked completion',
			slug: 'tracked-completion',
			priceInCents: 1200,
			trackInventory: true,
			inventory: 3
		});
		const untracked = await insertProductVariantFixture(t, {
			name: 'Unlimited completion',
			slug: 'unlimited-completion',
			priceInCents: 100,
			trackInventory: false,
			inventory: 0
		});
		const reservation = await t.mutation(createCheckoutReservation, {
			customerRef: CUSTOMER_REF,
			receiptToken: 'paid-reservation',
			items: [
				{ productVariantId: tracked.productVariantId, quantity: 2 },
				{ productVariantId: untracked.productVariantId, quantity: 4 }
			],
			firstName: 'Ada',
			lastName: 'Lovelace',
			email: 'ada@example.com',
			phone: '123',
			fulfillmentMethod: 'pickup'
		});
		await t.mutation(associateStripeCheckoutSession, {
			reservationId: reservation.reservationId,
			stripeCheckoutSessionId: 'cs_complete',
			expiresAt: reservation.expiresAt
		});
		const args = {
			reservationId: reservation.reservationId,
			checkout: reservation.checkout,
			payment: paidEvent(
				'cs_complete',
				'pi_complete',
				reservation.checkout.totalInCents,
				reservation.checkout.currency
			)
		};
		const [orderId, duplicateOrderId] = await Promise.all([
			t.mutation(completeCheckoutReservation, args),
			t.mutation(completeCheckoutReservation, args)
		]);

		expect(orderId).toBe(duplicateOrderId);
		expect(orderId).not.toBeNull();
		expect(emails).toHaveBeenCalledTimes(2);
		await t.run(async (ctx) => {
			expect(await ctx.db.get(tracked.productVariantId)).toMatchObject({
				inventory: 1,
				reservedInventory: 0
			});
			expect(await ctx.db.get(untracked.productVariantId)).toMatchObject({
				inventory: 0,
				reservedInventory: 0
			});
			expect(await ctx.db.get(reservation.reservationId)).toMatchObject({ status: 'completed' });
			expect(await ctx.db.query('orders').collect()).toHaveLength(1);
			expect(await ctx.db.query('orderItems').collect()).toHaveLength(2);
		});
	} finally {
		emails.mockRestore();
	}
});

test('leaves an unpaid reservation active and refuses payment after release', async () => {
	const t = createTestContext();
	const { productVariantId } = await insertProductVariantFixture(t, {
		name: 'Out of order event',
		slug: 'out-of-order-event',
		priceInCents: 1000,
		trackInventory: true,
		inventory: 1
	});
	const reservation = await t.mutation(createCheckoutReservation, {
		customerRef: CUSTOMER_REF,
		receiptToken: 'out-of-order-reservation',
		items: [{ productVariantId, quantity: 1 }],
		firstName: 'Ada',
		lastName: 'Lovelace',
		email: 'ada@example.com',
		phone: '123',
		fulfillmentMethod: 'pickup'
	});
	await t.mutation(associateStripeCheckoutSession, {
		reservationId: reservation.reservationId,
		stripeCheckoutSessionId: 'cs_out_of_order',
		expiresAt: reservation.expiresAt
	});
	const payment = paidEvent(
		'cs_out_of_order',
		'pi_out_of_order',
		reservation.checkout.totalInCents,
		reservation.checkout.currency
	);
	expect(
		await t.mutation(completeCheckoutReservation, {
			reservationId: reservation.reservationId,
			checkout: reservation.checkout,
			payment: { ...payment, paymentStatus: 'unpaid' }
		})
	).toBeNull();
	expect(await t.run((ctx) => ctx.db.get(productVariantId))).toMatchObject({
		inventory: 1,
		reservedInventory: 1
	});
	await t.mutation(releaseCheckoutReservation, { reservationId: reservation.reservationId });
	await expect(
		t.mutation(completeCheckoutReservation, {
			reservationId: reservation.reservationId,
			checkout: reservation.checkout,
			payment
		})
	).rejects.toMatchObject({ data: { code: 'CHECKOUT_RESERVATION_CONFLICT' } });
	await t.run(async (ctx) => {
		expect(await ctx.db.get(productVariantId)).toMatchObject({
			inventory: 1,
			reservedInventory: 0
		});
		expect(await ctx.db.query('orders').collect()).toEqual([]);
	});
});

test('rejects a payment already consumed by a competing reservation', async () => {
	const t = createTestContext();
	const { productVariantId } = await insertProductVariantFixture(t, {
		name: 'Competing payment',
		slug: 'competing-payment',
		priceInCents: 1000,
		trackInventory: true,
		inventory: 2
	});
	const input = {
		items: [{ productVariantId, quantity: 1 }],
		firstName: 'Ada',
		lastName: 'Lovelace',
		email: 'ada@example.com',
		phone: '123',
		fulfillmentMethod: 'pickup' as const
	};
	const first = await t.mutation(createCheckoutReservation, {
		...input,
		customerRef: CUSTOMER_REF,
		receiptToken: 'competing-first'
	});
	const second = await t.mutation(createCheckoutReservation, {
		...input,
		customerRef: CUSTOMER_REF,
		receiptToken: 'competing-second'
	});
	await t.mutation(associateStripeCheckoutSession, {
		reservationId: first.reservationId,
		stripeCheckoutSessionId: 'cs_competing_first',
		expiresAt: first.expiresAt
	});
	await t.mutation(associateStripeCheckoutSession, {
		reservationId: second.reservationId,
		stripeCheckoutSessionId: 'cs_competing_second',
		expiresAt: second.expiresAt
	});
	await t.mutation(completeCheckoutReservation, {
		reservationId: first.reservationId,
		checkout: first.checkout,
		payment: paidEvent(
			'cs_competing_first',
			'pi_competing',
			first.checkout.totalInCents,
			first.checkout.currency
		)
	});
	await expect(
		t.mutation(completeCheckoutReservation, {
			reservationId: second.reservationId,
			checkout: second.checkout,
			payment: paidEvent(
				'cs_competing_second',
				'pi_competing',
				second.checkout.totalInCents,
				second.checkout.currency
			)
		})
	).rejects.toThrow('Payment already belongs to another order.');
	await t.run(async (ctx) => {
		expect(await ctx.db.get(productVariantId)).toMatchObject({
			inventory: 1,
			reservedInventory: 1
		});
		expect(await ctx.db.get(second.reservationId)).toMatchObject({ status: 'active' });
		expect(await ctx.db.query('orders').collect()).toHaveLength(1);
	});
});

test('rolls back completion when reserved product variant inventory is inconsistent', async () => {
	const t = createTestContext();
	const { productVariantId } = await insertProductVariantFixture(t, {
		name: 'Insufficient completion',
		slug: 'insufficient-completion',
		priceInCents: 1000,
		trackInventory: true,
		inventory: 1
	});
	const reservation = await t.mutation(createCheckoutReservation, {
		customerRef: CUSTOMER_REF,
		receiptToken: 'insufficient-reservation',
		items: [{ productVariantId, quantity: 1 }],
		firstName: 'Ada',
		lastName: 'Lovelace',
		email: 'ada@example.com',
		phone: '123',
		fulfillmentMethod: 'pickup'
	});
	await t.mutation(associateStripeCheckoutSession, {
		reservationId: reservation.reservationId,
		stripeCheckoutSessionId: 'cs_insufficient',
		expiresAt: reservation.expiresAt
	});
	await t.run((ctx) => ctx.db.patch(productVariantId, { inventory: 0 }));
	await expect(
		t.mutation(completeCheckoutReservation, {
			reservationId: reservation.reservationId,
			checkout: reservation.checkout,
			payment: paidEvent(
				'cs_insufficient',
				'pi_insufficient',
				reservation.checkout.totalInCents,
				reservation.checkout.currency
			)
		})
	).rejects.toThrow('Checkout reservation inventory invariant violated.');
	await t.run(async (ctx) => {
		expect(await ctx.db.get(productVariantId)).toMatchObject({
			inventory: 0,
			reservedInventory: 1
		});
		expect(await ctx.db.get(reservation.reservationId)).toMatchObject({ status: 'active' });
		expect(await ctx.db.query('orders').collect()).toEqual([]);
	});
});

test('rejects payment created after an active reservation expires', async () => {
	const t = createTestContext();
	const { productVariantId } = await insertProductVariantFixture(t, {
		name: 'Expired payment',
		slug: 'expired-payment',
		priceInCents: 1000,
		trackInventory: true,
		inventory: 1
	});
	const reservation = await t.mutation(createCheckoutReservation, {
		customerRef: CUSTOMER_REF,
		receiptToken: 'expired-payment-reservation',
		items: [{ productVariantId, quantity: 1 }],
		firstName: 'Ada',
		lastName: 'Lovelace',
		email: 'ada@example.com',
		phone: '123',
		fulfillmentMethod: 'pickup'
	});
	await t.mutation(associateStripeCheckoutSession, {
		reservationId: reservation.reservationId,
		stripeCheckoutSessionId: 'cs_expired_payment',
		expiresAt: reservation.expiresAt
	});
	const eventCreatedAt = Math.floor(reservation.expiresAt / 1000) + 1;
	await expect(
		t.mutation(completeCheckoutReservation, {
			reservationId: reservation.reservationId,
			checkout: reservation.checkout,
			payment: paidEvent(
				'cs_expired_payment',
				'pi_expired_payment',
				reservation.checkout.totalInCents,
				reservation.checkout.currency,
				eventCreatedAt
			)
		})
	).rejects.toMatchObject({ data: { code: 'CHECKOUT_RESERVATION_CONFLICT' } });
	await t.run(async (ctx) => {
		expect(await ctx.db.get(productVariantId)).toMatchObject({
			inventory: 1,
			reservedInventory: 1
		});
		expect(await ctx.db.get(reservation.reservationId)).toMatchObject({ status: 'active' });
		expect(await ctx.db.query('orders').take(1)).toEqual([]);
	});
});

test('guest reservations keep the local customer id, and a malformed one is rejected', async () => {
	const t = createTestContext();
	const { productVariantId } = await insertProductVariantFixture(t, {
		name: 'Guest',
		slug: 'guest',
		priceInCents: 900,
		trackInventory: false,
		inventory: 0
	});
	const reservation = await t.mutation(createCheckoutReservation, {
		customerRef: CUSTOMER_REF,
		receiptToken: 'guest-receipt',
		items: [{ productVariantId, quantity: 1 }],
		firstName: 'Ada',
		lastName: 'Lovelace',
		email: 'ada@example.com',
		phone: '123',
		fulfillmentMethod: 'pickup'
	});
	expect(reservation.checkout.customerId).toBe(CUSTOMER_REF);

	await expect(
		t.mutation(createCheckoutReservation, {
			customerRef: 'not-a-uuid',
			receiptToken: 'bad-ref-receipt',
			items: [{ productVariantId, quantity: 1 }],
			firstName: 'Ada',
			lastName: 'Lovelace',
			email: 'ada@example.com',
			phone: '123',
			fulfillmentMethod: 'pickup'
		})
	).rejects.toMatchObject({ data: { code: 'INVALID_ORDER_DATA' } });
});
