/// <reference types="vite/client" />

import aggregateTest from '@convex-dev/aggregate/test';
import rateLimiterTest from '@convex-dev/rate-limiter/test';
import resendTest from '@convex-dev/resend/test';
import { convexTest } from 'convex-test';
import auditLogTest from 'convex-audit-log/test';
import { expect, test, vi } from 'vitest';
import Stripe from 'stripe';

import { api, internal } from '../../src/convex/_generated/api';
import schema from '../../src/convex/schema';
import * as emailService from '../../src/convex/emails/sendEmail';

const modules = import.meta.glob('../../src/convex/**/*.ts');

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

test('prepares checkout without orders, then creates one paid snapshot with protected access', async () => {
	const t = createTestContext();
	const owner = t.withIdentity({ subject: 'buyer', tokenIdentifier: 'issuer|buyer' });
	const { productId, productVariantId } = await t.run(async (ctx) => {
		const categoryId = await ctx.db.insert('categories', {
			name: 'Orders',
			slug: 'orders',
			status: 'active'
		});
		const insertedProductId = await ctx.db.insert('products', {
			name: 'Snapshot product',
			slug: 'snapshot-product',
			description: 'Original details',
			priceInCents: 1299,
			categoryId,
			images: [],
			imageKeys: [],
			storagePrefix: 'products',
			trackInventory: true,
			productVariantOptionNames: [],
			hasPriceRange: false,
			upsellProductIds: [],
			status: 'active'
		});
		const insertedProductVariantId = await ctx.db.insert('productVariants', {
			productId: insertedProductId,
			position: 0,
			options: [],
			sku: 'snapshot-product-sku',
			imageKeys: [],
			priceInCents: 1299,
			inventory: 0,
			reservedInventory: 0
		});

		return { productId: insertedProductId, productVariantId: insertedProductVariantId };
	});
	const input = {
		receiptToken: 'test-receipt-token',
		items: [
			{ productVariantId, quantity: 1 },
			{ productVariantId, quantity: 1 }
		],
		firstName: 'Ada',
		lastName: 'Lovelace',
		email: 'ada@example.com',
		phone: '+1 555 0100',
		fulfillmentMethod: 'pickup' as const
	};
	const prepare = internal.tables.orders.queries.fetchCheckoutOrder.fetchCheckoutOrder;
	const checkout = await owner.query(prepare, input);
	expect(checkout).toMatchObject({
		customerId: 'buyer',
		totalInCents: 2598,
		items: [{ name: 'Snapshot product', unitPriceInCents: 1299, quantity: 2 }]
	});
	expect(await t.run((ctx) => ctx.db.query('orders').collect())).toEqual([]);
	expect(await t.run((ctx) => ctx.db.query('orderItems').collect())).toEqual([]);
	await expect(
		owner.query(prepare, {
			...input,
			items: [
				{ productVariantId, quantity: 99 },
				{ productVariantId, quantity: 1 }
			]
		})
	).rejects.toMatchObject({ data: { code: 'INVALID_ORDER_DATA' } });

	const result = { receiptToken: input.receiptToken };
	expect(
		await t.query(api.tables.orders.queries.fetchOrderReceipt.fetchOrderReceipt, {
			receiptToken: result.receiptToken
		})
	).toBeNull();

	const create = internal.tables.orders.mutations.createOrder.createOrder;
	const payment = {
		eventType: 'checkout.session.completed' as const,
		eventCreatedAt: 2000,
		stripeCheckoutSessionId: 'cs_paid',
		stripePaymentIntentId: 'pi_paid',
		checkoutStatus: 'complete' as const,
		paymentStatus: 'paid' as const,
		currency: checkout.currency.toLowerCase(),
		totalInCents: 2598
	};
	const paid = { checkout: { ...checkout, receiptToken: result.receiptToken }, payment };
	expect(
		await t.mutation(create, { ...paid, payment: { ...payment, paymentStatus: 'unpaid' } })
	).toBeNull();
	expect(await t.run((ctx) => ctx.db.query('orders').collect())).toEqual([]);
	await expect(
		t.mutation(create, { ...paid, payment: { ...payment, totalInCents: 1 } })
	).rejects.toThrow();
	await t.run(async (ctx) => {
		await ctx.db.patch(productId, { name: 'Changed', status: 'archived' });
		await ctx.db.patch(productVariantId, { priceInCents: 9999 });
	});
	const [orderId, duplicate] = await Promise.all([
		t.mutation(create, paid),
		t.mutation(create, paid)
	]);
	expect(duplicate).toBe(orderId);
	if (!orderId) throw new Error('Expected a paid order.');
	expect(await t.run((ctx) => ctx.db.query('orders').collect())).toHaveLength(1);
	expect(await t.run((ctx) => ctx.db.query('orderItems').collect())).toMatchObject([
		{ name: 'Snapshot product', unitPriceInCents: 1299, quantity: 2 }
	]);
	const order = await t.run((ctx) => ctx.db.get(orderId));
	expect(order).toMatchObject({
		paymentStatus: 'paid',
		paidAt: 2000000,
		totalInCents: 2598,
		customerId: 'buyer'
	});
	const getOrder = api.tables.orders.queries.fetchMyOrder.fetchMyOrder;
	const code = order!.code;
	expect(await t.query(getOrder, { code })).toBeNull();
	expect(await t.withIdentity({ subject: 'other' }).query(getOrder, { code })).toBeNull();
	expect(await owner.query(getOrder, { code })).not.toBeNull();
	expect(
		await t.query(getOrder, {
			code,
			guestOrders: [{ id: orderId, receiptToken: result.receiptToken }]
		})
	).not.toBeNull();
	await t.run((ctx) => ctx.db.patch(orderId, { customerId: undefined }));
	expect(await t.query(getOrder, { code })).toBeNull();
	expect(
		await t.query(getOrder, { code, guestOrders: [{ id: orderId, receiptToken: 'wrong' }] })
	).toBeNull();
	await t.run((ctx) => ctx.db.patch(orderId, { paymentStatus: 'refunded' }));
	expect(await t.mutation(create, paid)).toBe(orderId);
	expect((await t.run((ctx) => ctx.db.get(orderId)))?.paymentStatus).toBe('refunded');
	await expect(
		t.mutation(create, { ...paid, payment: { ...payment, stripePaymentIntentId: 'pi_other' } })
	).rejects.toThrow();
});

test('verified webhook creates an order only after payment and queues emails once', async () => {
	const emails = vi.spyOn(emailService, 'sendEmail');
	vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_local');
	vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_local');
	const { stripe } = await import('../../src/convex/stripe/stripe.config');
	const t = createTestContext();
	const { productId, productVariantId } = await t.run(async (ctx) => {
		const categoryId = await ctx.db.insert('categories', {
			name: 'Test',
			slug: 'test',
			status: 'active'
		});
		const insertedProductId = await ctx.db.insert('products', {
			name: 'Paid product',
			slug: 'paid',
			description: 'Test',
			priceInCents: 1200,
			categoryId,
			images: [],
			imageKeys: [],
			storagePrefix: 'products',
			trackInventory: true,
			productVariantOptionNames: ['Color'],
			hasPriceRange: false,
			upsellProductIds: [],
			status: 'active'
		});
		const insertedProductVariantId = await ctx.db.insert('productVariants', {
			productId: insertedProductId,
			position: 0,
			options: [{ name: 'Color', value: 'Red' }],
			sku: 'paid-sku',
			imageKeys: [],
			priceInCents: 1200,
			inventory: 10,
			reservedInventory: 0
		});

		return { productId: insertedProductId, productVariantId: insertedProductVariantId };
	});
	const checkout = await t.query(
		internal.tables.orders.queries.fetchCheckoutOrder.fetchCheckoutOrder,
		{
			receiptToken: 'test-webhook-receipt-token',
			items: [{ productVariantId, quantity: 2 }],
			firstName: 'Ada',
			lastName: 'Lovelace',
			email: 'ada@example.com',
			phone: '123',
			fulfillmentMethod: 'delivery',
			shippingAddress: { street: 'Street', city: 'City', postalCode: '123', country: 'US' }
		}
	);
	vi.stubEnv('PUBLIC_ORIGIN', 'https://shop.test');
	let sessionNumber = 0;
	const createSession = vi
		.spyOn(stripe.checkout.sessions, 'create')
		.mockImplementation(async () => {
			sessionNumber += 1;
			// SAFETY: this mock only supplies the Session fields read by the checkout action.
			return {
				id: `cs_open_${sessionNumber}`,
				status: 'open',
				expires_at: Math.ceil(Date.now() / 1000) + 1800,
				url: 'https://checkout.stripe.test/session'
			} as Stripe.Response<Stripe.Checkout.Session>;
		});
	const input = {
		customerRef: '00000000-0000-4000-8000-000000000002',
		items: checkout.items.map(({ productVariantId, quantity }) => ({
			productVariantId,
			quantity
		})),
		firstName: checkout.firstName,
		lastName: checkout.lastName,
		email: checkout.email,
		phone: checkout.phone,
		fulfillmentMethod: checkout.fulfillmentMethod,
		shippingAddress: checkout.shippingAddress
	};
	const buyer = t.withIdentity({ subject: 'buyer', tokenIdentifier: 'issuer|buyer' });
	// Submit the same cart twice: both requests create a fresh Session and reservation.
	const action = api.stripe.actions.createStripeCheckout.createStripeCheckout;
	await buyer.action(action, { ...input });
	await buyer.action(action, { ...input });
	expect(createSession).toHaveBeenCalledTimes(2);
	expect(createSession.mock.calls[0]).toHaveLength(1);
	const metadata = createSession.mock.calls[0][0]!.metadata!;
	const secondMetadata = createSession.mock.calls[1][0]!.metadata!;
	const receiptToken = String(metadata.receiptToken);
	expect(createSession.mock.calls[1][0]!.metadata!.receiptToken).not.toBe(receiptToken);
	expect(await t.run((ctx) => ctx.db.query('orders').collect())).toEqual([]);
	expect(await t.run((ctx) => ctx.db.query('checkoutReservations').collect())).toHaveLength(2);
	expect(await t.run((ctx) => ctx.db.get(productVariantId))).toMatchObject({
		reservedInventory: 4
	});
	createSession.mockRestore();
	const session = {
		id: 'cs_open_1',
		object: 'checkout.session',
		mode: 'payment',
		livemode: false,
		status: 'complete',
		payment_status: 'paid',
		payment_intent: 'pi_webhook',
		amount_total: 2400,
		currency: checkout.currency.toLowerCase(),
		metadata
	};
	const lines: Stripe.Response<Stripe.ApiList<Stripe.LineItem>> = {
		object: 'list',
		lastResponse: { headers: {}, requestId: 'req_test', statusCode: 200 },
		has_more: false,
		url: '/line_items',
		data: [
			{
				id: 'li_test',
				object: 'item',
				adjustable_quantity: null,
				amount_discount: 0,
				amount_subtotal: 2400,
				amount_tax: 0,
				metadata: {},
				// Stripe copies the display name (product plus variant label) here.
				description: 'Paid product — Red',
				quantity: 2,
				amount_total: 2400,
				currency: session.currency,
				price: {
					id: 'price_test',
					object: 'price',
					active: true,
					billing_scheme: 'per_unit',
					created: 1000,
					custom_unit_amount: null,
					livemode: false,
					lookup_key: null,
					metadata: {},
					nickname: null,
					recurring: null,
					tax_behavior: null,
					tiers_mode: null,
					transform_quantity: null,
					type: 'one_time',
					unit_amount_decimal: null,
					unit_amount: 1200,
					currency: session.currency,
					product: {
						id: 'prod_test',
						object: 'product',
						active: true,
						created: 1000,
						description: null,
						images: [],
						livemode: false,
						marketing_features: [],
						metadata: {
							productId,
							productVariantId,
							productName: 'Paid product',
							productVariantLabel: 'Red',
							sku: 'paid-sku'
						},
						name: 'Paid product',
						package_dimensions: null,
						shippable: null,
						type: 'good',
						updated: 1000,
						url: null
					}
				}
			}
		]
	};
	const list = vi.spyOn(stripe.checkout.sessions, 'listLineItems').mockResolvedValue(lines);
	async function send(type: string, object = session, valid = true) {
		const payload = JSON.stringify({
			id: 'evt_test',
			type,
			livemode: false,
			created: 2000,
			data: { object }
		});
		const signature = stripe.webhooks.generateTestHeaderString({
			payload,
			secret: valid ? 'whsec_local' : 'wrong'
		});
		return t.action(internal.stripe.actions.verifyStripeWebhook.verifyStripeWebhook, {
			payload,
			signature
		});
	}
	try {
		expect(await send('checkout.session.completed', session, false)).toBe(false);
		await send('checkout.session.expired', {
			...session,
			id: 'cs_open_2',
			metadata: secondMetadata,
			status: 'expired',
			payment_status: 'unpaid'
		});
		await send('checkout.session.async_payment_failed', {
			...session,
			id: 'cs_open_2',
			metadata: secondMetadata,
			payment_status: 'unpaid'
		});
		await send('checkout.session.completed', { ...session, payment_status: 'unpaid' });
		expect(list).not.toHaveBeenCalled();
		expect(emails).not.toHaveBeenCalled();
		expect(await t.run((ctx) => ctx.db.query('orders').collect())).toEqual([]);
		await expect(
			send('checkout.session.completed', { ...session, amount_total: 1 })
		).rejects.toThrow();
		await expect(
			send('checkout.session.completed', { ...session, livemode: true })
		).rejects.toThrow();
		await expect(
			send('checkout.session.async_payment_succeeded', { ...session, payment_status: 'unpaid' })
		).rejects.toThrow();
		await expect(send('checkout.session.async_payment_failed')).rejects.toThrow();
		await send('checkout.session.async_payment_succeeded');
		await send('checkout.session.completed');
		await send('checkout.session.async_payment_failed', { ...session, payment_status: 'unpaid' });
		const receipt = await t.query(api.tables.orders.queries.fetchOrderReceipt.fetchOrderReceipt, {
			receiptToken
		});
		expect(receipt?.order).toMatchObject({
			paymentStatus: 'paid',
			totalInCents: 2400,
			shippingAddress: { street: 'Street', city: 'City' }
		});
		expect(await t.run((ctx) => ctx.db.query('orders').collect())).toHaveLength(1);
		expect(await t.run((ctx) => ctx.db.query('orderItems').collect())).toMatchObject([
			{ name: 'Paid product', productVariantLabel: 'Red', sku: 'paid-sku', quantity: 2 }
		]);
		expect(emails).toHaveBeenCalledTimes(2);
		expect(new Set(emails.mock.calls.map(([, message]) => message.idempotencyKey)).size).toBe(2);
	} finally {
		emails.mockRestore();
		list.mockRestore();
		vi.unstubAllEnvs();
	}
});

test('keeps order administration private and blocks unpaid fulfillment', async () => {
	const t = createTestContext();
	const user = t.withIdentity({ tokenIdentifier: 'order-user', subject: 'order-user' });
	const admin = t.withIdentity({
		tokenIdentifier: 'order-admin',
		subject: 'order-admin',
		role: 'admin'
	});
	const orderId = await t.run((ctx) =>
		ctx.db.insert('orders', {
			code: 'ADM001',
			receiptToken: 'admin-order',
			lineFingerprint: 'line',
			currency: 'USD',
			firstName: 'Grace',
			lastName: 'Hopper',
			email: 'grace@example.com',
			phone: '+1 555 0101',
			fulfillmentMethod: 'pickup',
			subtotalInCents: 100,
			totalInCents: 100,
			paymentStatus: 'pending',
			fulfillmentStatus: 'unfulfilled',
			updatedAt: Date.now()
		})
	);

	await expect(
		user.query(api.tables.orders.queries.fetchOrderAdmin.fetchOrderAdmin, { id: orderId })
	).rejects.toMatchObject({ data: { code: 'FORBIDDEN' } });
	await expect(
		admin.mutation(api.tables.orders.mutations.updateOrderAdmin.updateOrderAdmin, {
			id: orderId,
			action: 'fulfill'
		})
	).rejects.toMatchObject({ data: { code: 'ORDER_PAYMENT_REQUIRED' } });

	await t.run((ctx) => ctx.db.patch(orderId, { paymentStatus: 'paid' }));
	await admin.mutation(api.tables.orders.mutations.updateOrderAdmin.updateOrderAdmin, {
		id: orderId,
		action: 'fulfill'
	});
	await admin.mutation(api.tables.orders.mutations.updateOrderAdmin.updateOrderAdmin, {
		id: orderId,
		action: 'unfulfill'
	});

	expect(await t.run((ctx) => ctx.db.get(orderId))).toMatchObject({
		paymentStatus: 'paid',
		fulfillmentStatus: 'unfulfilled'
	});
	await expect(
		admin.action(api.stripe.actions.refundOrder.refundOrder, { id: orderId })
	).rejects.toMatchObject({ data: { code: 'ORDER_REFUND_UNAVAILABLE' } });
});

test('admin refunds use Stripe idempotency and webhook state transitions', async () => {
	vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_local');
	vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_local');
	const { stripe } = await import('../../src/convex/stripe/stripe.config');
	const t = createTestContext();
	const admin = t.withIdentity({
		tokenIdentifier: 'refund-admin',
		subject: 'refund-admin',
		role: 'admin'
	});
	const orderId = await t.run((ctx) =>
		ctx.db.insert('orders', {
			code: 'REF001',
			receiptToken: 'refund-order',
			lineFingerprint: 'line',
			currency: 'USD',
			firstName: 'Ada',
			lastName: 'Lovelace',
			email: 'ada@example.com',
			phone: '+1 555 0103',
			fulfillmentMethod: 'pickup',
			subtotalInCents: 2400,
			totalInCents: 2400,
			paymentStatus: 'paid',
			stripePaymentIntentId: 'pi_refund',
			fulfillmentStatus: 'fulfilled',
			updatedAt: Date.now()
		})
	);
	// SAFETY: this mock only supplies the Refund fields used by the refund action and webhook.
	const pendingRefund = {
		id: 're_refund',
		object: 'refund',
		amount: 2400,
		currency: 'usd',
		created: 3000,
		payment_intent: 'pi_refund',
		status: 'pending'
	} as Stripe.Response<Stripe.Refund>;
	const createRefund = vi.spyOn(stripe.refunds, 'create').mockResolvedValue(pendingRefund);
	async function sendRefund(type: string, eventObject: Stripe.Event.Data.Object, created: number) {
		const payload = JSON.stringify({
			id: 'evt_refund',
			type,
			livemode: false,
			created,
			data: { object: eventObject }
		});
		const signature = stripe.webhooks.generateTestHeaderString({
			payload,
			secret: 'whsec_local'
		});
		return t.action(internal.stripe.actions.verifyStripeWebhook.verifyStripeWebhook, {
			payload,
			signature
		});
	}
	try {
		await admin.action(api.stripe.actions.refundOrder.refundOrder, { id: orderId });
		expect(createRefund).toHaveBeenCalledWith(
			{ payment_intent: 'pi_refund', amount: 2400 },
			{ idempotencyKey: `order-refund:${orderId}` }
		);
		expect(await t.run((ctx) => ctx.db.get(orderId))).toMatchObject({
			paymentStatus: 'refund_pending'
		});

		await sendRefund('refund.updated', { ...pendingRefund, status: 'succeeded' }, 4000);
		expect(await t.run((ctx) => ctx.db.get(orderId))).toMatchObject({
			paymentStatus: 'refunded',
			refundedAt: 4000000,
			refundedAmountInCents: 2400
		});

		await sendRefund('refund.failed', { ...pendingRefund, status: 'failed' }, 5000);
		expect((await t.run((ctx) => ctx.db.get(orderId)))?.paymentStatus).toBe('refunded');
		await admin.action(api.stripe.actions.refundOrder.refundOrder, { id: orderId });
		expect(createRefund).toHaveBeenCalledTimes(1);
	} finally {
		createRefund.mockRestore();
		vi.unstubAllEnvs();
	}
});

test('filters admin orders by payment, fulfillment, and method', async () => {
	const t = createTestContext();
	const user = t.withIdentity({ tokenIdentifier: 'filter-user', subject: 'filter-user' });
	const admin = t.withIdentity({
		tokenIdentifier: 'filter-admin',
		subject: 'filter-admin',
		role: 'admin'
	});

	await t.run(async (ctx) => {
		const order = {
			code: 'FIL001',
			lineFingerprint: 'line',
			currency: 'USD',
			firstName: 'Test',
			lastName: 'Customer',
			phone: '+1 555 0102',
			subtotalInCents: 100,
			totalInCents: 100,
			updatedAt: Date.now()
		};
		await ctx.db.insert('orders', {
			...order,
			receiptToken: 'matching-order',
			email: 'matching@example.com',
			paymentStatus: 'paid',
			fulfillmentStatus: 'fulfilled',
			fulfillmentMethod: 'delivery'
		});
		await ctx.db.insert('orders', {
			...order,
			code: 'FIL002',
			receiptToken: 'newer-nonmatching-order',
			email: 'nonmatching@example.com',
			paymentStatus: 'paid',
			fulfillmentStatus: 'unfulfilled',
			fulfillmentMethod: 'delivery'
		});
	});

	const query = api.tables.orders.queries.fetchAllOrdersAdmin.fetchAllOrdersAdmin;
	const args = {
		paginationOpts: { cursor: null, numItems: 1 },
		filters: {
			paymentStatus: 'paid',
			fulfillmentStatus: 'fulfilled',
			fulfillmentMethod: 'delivery'
		}
	};

	await expect(user.query(query, args)).rejects.toMatchObject({ data: { code: 'FORBIDDEN' } });
	const result = await admin.query(query, args);
	expect(result.items.map((order) => order.email)).toEqual(['matching@example.com']);
});
