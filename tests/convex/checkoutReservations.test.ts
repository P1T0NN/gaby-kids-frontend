/// <reference types="vite/client" />

import aggregateTest from '@convex-dev/aggregate/test';
import resendTest from '@convex-dev/resend/test';
import { convexTest } from 'convex-test';
import { expect, test, vi } from 'vitest';

import { internal } from '../../src/convex/_generated/api';
import schema from '../../src/convex/schema';
import * as emailService from '../../src/convex/emails/sendEmail';

const modules = import.meta.glob('../../src/convex/**/*.ts');

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
		const [trackedProductId, untrackedProductId] = await t.run(async (ctx) => {
			const categoryId = await ctx.db.insert('categories', {
				name: 'Reservations',
				slug: 'reservations',
				status: 'active'
			});
			const fields = {
				description: 'Original description',
				categoryId,
				images: [],
				storagePrefix: 'products',
				reservedInventory: 0,
				upsellProductIds: [],
				status: 'active' as const
			};
			return Promise.all([
				ctx.db.insert('products', {
					...fields,
					name: 'Tracked',
					slug: 'tracked',
					priceInCents: 1250,
					imageKeys: ['https://example.com/tracked.jpg'],
					trackInventory: true,
					inventory: 3
				}),
				ctx.db.insert('products', {
					...fields,
					name: 'Unlimited',
					slug: 'unlimited',
					priceInCents: 500,
					imageKeys: [],
					trackInventory: false,
					inventory: 0
				})
			]);
		});
		const buyer = t.withIdentity({ subject: 'buyer', tokenIdentifier: 'issuer|buyer' });
		const reservation = await buyer.mutation(createCheckoutReservation, {
			receiptToken: 'reservation-receipt',
			items: [
				{ productId: trackedProductId, quantity: 1 },
				{ productId: trackedProductId, quantity: 1 },
				{ productId: untrackedProductId, quantity: 99 }
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
					productId: trackedProductId,
					name: 'Tracked',
					quantity: 2,
					unitPriceInCents: 1250,
					imageUrl: 'https://example.com/tracked.jpg'
				},
				{
					productId: untrackedProductId,
					name: 'Unlimited',
					quantity: 99,
					unitPriceInCents: 500,
					imageUrl: ''
				}
			])
		);
		expect(reservation.checkout.items[0]).not.toHaveProperty('trackInventory');

		await t.run(async (ctx) => {
			expect(await ctx.db.get(trackedProductId)).toMatchObject({ reservedInventory: 2 });
			expect(await ctx.db.get(untrackedProductId)).toMatchObject({ reservedInventory: 0 });
			const stored = await ctx.db.get(reservation.reservationId);
			expect(stored).toMatchObject({ status: 'active' });
			expect(stored).not.toHaveProperty('checkout');
			expect(stored).not.toHaveProperty('receiptToken');
			expect(stored).not.toHaveProperty('email');
			expect(stored?.items.every((item) => !('imageUrl' in item))).toBe(true);
			expect(stored?.items).toEqual(
				expect.arrayContaining([
					{
						productId: trackedProductId,
						name: 'Tracked',
						unitPriceInCents: 1250,
						quantity: 2,
						trackInventory: true
					},
					{
						productId: untrackedProductId,
						name: 'Unlimited',
						unitPriceInCents: 500,
						quantity: 99,
						trackInventory: false
					}
				])
			);
			await ctx.db.patch(trackedProductId, { name: 'Changed', priceInCents: 9999 });
			const snapshot = (await ctx.db.get(reservation.reservationId))?.items.find(
				(item) => item.productId === trackedProductId
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
			expect(await ctx.db.get(trackedProductId)).toMatchObject({ reservedInventory: 0 });
			expect(await ctx.db.get(untrackedProductId)).toMatchObject({ reservedInventory: 0 });
		});
	} finally {
		vi.useRealTimers();
	}
});

test('competing reservations cannot oversell tracked inventory', async () => {
	const t = createTestContext();
	const productId = await t.run(async (ctx) => {
		const categoryId = await ctx.db.insert('categories', {
			name: 'Last item',
			slug: 'last-item',
			status: 'active'
		});
		return ctx.db.insert('products', {
			name: 'Last item',
			slug: 'only-one',
			description: 'One remains',
			priceInCents: 1000,
			categoryId,
			images: [],
			imageKeys: [],
			storagePrefix: 'products',
			trackInventory: true,
			inventory: 1,
			reservedInventory: 0,
			upsellProductIds: [],
			status: 'active'
		});
	});
	const input = {
		items: [{ productId, quantity: 1 }],
		firstName: 'Ada',
		lastName: 'Lovelace',
		email: 'ada@example.com',
		phone: '123',
		fulfillmentMethod: 'pickup' as const
	};
	const results = await Promise.allSettled([
		t.mutation(createCheckoutReservation, { ...input, receiptToken: 'first' }),
		t.mutation(createCheckoutReservation, { ...input, receiptToken: 'second' })
	]);

	expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
	const rejected = results.find((result) => result.status === 'rejected');
	expect(rejected?.reason).toMatchObject({ data: { code: 'ORDER_PRODUCT_UNAVAILABLE' } });
	await t.run(async (ctx) => {
		expect(await ctx.db.get(productId)).toMatchObject({ reservedInventory: 1 });
		expect(await ctx.db.query('checkoutReservations').take(2)).toHaveLength(1);
	});
});

test('rejects a reservation when tracked inventory is zero', async () => {
	const t = createTestContext();
	const productId = await t.run(async (ctx) => {
		const categoryId = await ctx.db.insert('categories', {
			name: 'Sold out',
			slug: 'sold-out',
			status: 'active'
		});
		return ctx.db.insert('products', {
			name: 'Sold out item',
			slug: 'sold-out-item',
			description: 'Nothing left',
			priceInCents: 1000,
			categoryId,
			images: [],
			imageKeys: [],
			storagePrefix: 'products',
			trackInventory: true,
			inventory: 0,
			reservedInventory: 0,
			upsellProductIds: [],
			status: 'active'
		});
	});
	await expect(
		t.mutation(createCheckoutReservation, {
			receiptToken: 'sold-out-reservation',
			items: [{ productId, quantity: 1 }],
			firstName: 'Ada',
			lastName: 'Lovelace',
			email: 'ada@example.com',
			phone: '123',
			fulfillmentMethod: 'pickup'
		})
	).rejects.toMatchObject({ data: { code: 'ORDER_PRODUCT_UNAVAILABLE' } });
	await t.run(async (ctx) => {
		expect(await ctx.db.get(productId)).toMatchObject({ inventory: 0, reservedInventory: 0 });
		expect(await ctx.db.query('checkoutReservations').take(1)).toEqual([]);
	});
});

test('association, release, and expiration cleanup are idempotent', async () => {
	vi.useFakeTimers();
	try {
		const now = new Date('2026-09-16T12:00:00Z');
		vi.setSystemTime(now);
		const t = createTestContext();
		const productId = await t.run(async (ctx) => {
			const categoryId = await ctx.db.insert('categories', {
				name: 'Lifecycle',
				slug: 'lifecycle',
				status: 'active'
			});
			return ctx.db.insert('products', {
				name: 'Lifecycle product',
				slug: 'lifecycle-product',
				description: 'Lifecycle',
				priceInCents: 1000,
				categoryId,
				images: [],
				imageKeys: [],
				storagePrefix: 'products',
				trackInventory: true,
				inventory: 4,
				reservedInventory: 0,
				upsellProductIds: [],
				status: 'active'
			});
		});
		const input = {
			items: [{ productId, quantity: 1 }],
			firstName: 'Ada',
			lastName: 'Lovelace',
			email: 'ada@example.com',
			phone: '123',
			fulfillmentMethod: 'pickup' as const
		};
		const first = await t.mutation(createCheckoutReservation, {
			...input,
			receiptToken: 'first'
		});
		const second = await t.mutation(createCheckoutReservation, {
			...input,
			receiptToken: 'second',
			items: [{ productId, quantity: 2 }]
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
		expect(await t.run((ctx) => ctx.db.get(productId))).toMatchObject({ reservedInventory: 2 });

		vi.setSystemTime(new Date(now.getTime() + 31 * 60_000));
		expect(await t.mutation(deleteExpiredCheckoutReservationsCron, {})).toBe(1);
		expect(await t.mutation(deleteExpiredCheckoutReservationsCron, {})).toBe(0);
		await t.run(async (ctx) => {
			expect(await ctx.db.get(productId)).toMatchObject({ reservedInventory: 0 });
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
		const [trackedProductId, untrackedProductId] = await t.run(async (ctx) => {
			const categoryId = await ctx.db.insert('categories', {
				name: 'Paid reservations',
				slug: 'paid-reservations',
				status: 'active'
			});
			const fields = {
				description: 'Completion test',
				categoryId,
				images: [],
				imageKeys: [],
				storagePrefix: 'products',
				reservedInventory: 0,
				upsellProductIds: [],
				status: 'active' as const
			};
			return Promise.all([
				ctx.db.insert('products', {
					...fields,
					name: 'Tracked completion',
					slug: 'tracked-completion',
					priceInCents: 1200,
					trackInventory: true,
					inventory: 3
				}),
				ctx.db.insert('products', {
					...fields,
					name: 'Unlimited completion',
					slug: 'unlimited-completion',
					priceInCents: 100,
					trackInventory: false,
					inventory: 0
				})
			]);
		});
		const reservation = await t.mutation(createCheckoutReservation, {
			receiptToken: 'paid-reservation',
			items: [
				{ productId: trackedProductId, quantity: 2 },
				{ productId: untrackedProductId, quantity: 4 }
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
			expect(await ctx.db.get(trackedProductId)).toMatchObject({
				inventory: 1,
				reservedInventory: 0
			});
			expect(await ctx.db.get(untrackedProductId)).toMatchObject({
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
	const productId = await t.run(async (ctx) =>
		ctx.db.insert('products', {
			name: 'Out of order event',
			slug: 'out-of-order-event',
			description: 'Out of order test',
			priceInCents: 1000,
			categoryId: await ctx.db.insert('categories', {
				name: 'Out of order',
				slug: 'out-of-order',
				status: 'active'
			}),
			images: [],
			imageKeys: [],
			storagePrefix: 'products',
			trackInventory: true,
			inventory: 1,
			reservedInventory: 0,
			upsellProductIds: [],
			status: 'active'
		})
	);
	const reservation = await t.mutation(createCheckoutReservation, {
		receiptToken: 'out-of-order-reservation',
		items: [{ productId, quantity: 1 }],
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
	expect(await t.run((ctx) => ctx.db.get(productId))).toMatchObject({
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
		expect(await ctx.db.get(productId)).toMatchObject({ inventory: 1, reservedInventory: 0 });
		expect(await ctx.db.query('orders').collect()).toEqual([]);
	});
});

test('rejects a payment already consumed by a competing reservation', async () => {
	const t = createTestContext();
	const productId = await t.run(async (ctx) =>
		ctx.db.insert('products', {
			name: 'Competing payment',
			slug: 'competing-payment',
			description: 'Competing payment test',
			priceInCents: 1000,
			categoryId: await ctx.db.insert('categories', {
				name: 'Competing completion',
				slug: 'competing-completion',
				status: 'active'
			}),
			images: [],
			imageKeys: [],
			storagePrefix: 'products',
			trackInventory: true,
			inventory: 2,
			reservedInventory: 0,
			upsellProductIds: [],
			status: 'active'
		})
	);
	const input = {
		items: [{ productId, quantity: 1 }],
		firstName: 'Ada',
		lastName: 'Lovelace',
		email: 'ada@example.com',
		phone: '123',
		fulfillmentMethod: 'pickup' as const
	};
	const first = await t.mutation(createCheckoutReservation, {
		...input,
		receiptToken: 'competing-first'
	});
	const second = await t.mutation(createCheckoutReservation, {
		...input,
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
		expect(await ctx.db.get(productId)).toMatchObject({ inventory: 1, reservedInventory: 1 });
		expect(await ctx.db.get(second.reservationId)).toMatchObject({ status: 'active' });
		expect(await ctx.db.query('orders').collect()).toHaveLength(1);
	});
});

test('rolls back completion when reserved inventory is inconsistent', async () => {
	const t = createTestContext();
	const productId = await t.run(async (ctx) =>
		ctx.db.insert('products', {
			name: 'Insufficient completion',
			slug: 'insufficient-completion',
			description: 'Insufficient test',
			priceInCents: 1000,
			categoryId: await ctx.db.insert('categories', {
				name: 'Insufficient',
				slug: 'insufficient',
				status: 'active'
			}),
			images: [],
			imageKeys: [],
			storagePrefix: 'products',
			trackInventory: true,
			inventory: 1,
			reservedInventory: 0,
			upsellProductIds: [],
			status: 'active'
		})
	);
	const reservation = await t.mutation(createCheckoutReservation, {
		receiptToken: 'insufficient-reservation',
		items: [{ productId, quantity: 1 }],
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
	await t.run((ctx) => ctx.db.patch(productId, { inventory: 0 }));
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
		expect(await ctx.db.get(productId)).toMatchObject({ inventory: 0, reservedInventory: 1 });
		expect(await ctx.db.get(reservation.reservationId)).toMatchObject({ status: 'active' });
		expect(await ctx.db.query('orders').collect()).toEqual([]);
	});
});

test('rejects payment created after an active reservation expires', async () => {
	const t = createTestContext();
	const productId = await t.run(async (ctx) =>
		ctx.db.insert('products', {
			name: 'Expired payment',
			slug: 'expired-payment',
			description: 'Expired payment test',
			priceInCents: 1000,
			categoryId: await ctx.db.insert('categories', {
				name: 'Expired payment',
				slug: 'expired-payment',
				status: 'active'
			}),
			images: [],
			imageKeys: [],
			storagePrefix: 'products',
			trackInventory: true,
			inventory: 1,
			reservedInventory: 0,
			upsellProductIds: [],
			status: 'active'
		})
	);
	const reservation = await t.mutation(createCheckoutReservation, {
		receiptToken: 'expired-payment-reservation',
		items: [{ productId, quantity: 1 }],
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
		expect(await ctx.db.get(productId)).toMatchObject({ inventory: 1, reservedInventory: 1 });
		expect(await ctx.db.get(reservation.reservationId)).toMatchObject({ status: 'active' });
		expect(await ctx.db.query('orders').take(1)).toEqual([]);
	});
});
