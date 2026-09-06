/// <reference types="vite/client" />

import aggregateTest from '@convex-dev/aggregate/test';
import rateLimiterTest from '@convex-dev/rate-limiter/test';
import { convexTest } from 'convex-test';
import auditLogTest from 'convex-audit-log/test';
import { expect, test } from 'vitest';

import { api } from '../../src/convex/_generated/api';
import schema from '../../src/convex/schema';

const modules = import.meta.glob('../../src/convex/**/*.ts');

function createTestContext() {
	const t = convexTest(schema, modules);
	aggregateTest.register(t, 'productsAggregate');
	aggregateTest.register(t, 'categoriesAggregate');
	aggregateTest.register(t, 'ordersAggregate');
	rateLimiterTest.register(t);
	auditLogTest.register(t);
	return t;
}

test('creates one server-priced snapshot and deduplicates checkout retries', async () => {
	const t = createTestContext();
	const productId = await t.run(async (ctx) => {
		const categoryId = await ctx.db.insert('categories', {
			name: 'Orders',
			slug: 'orders',
			status: 'active'
		});
		return ctx.db.insert('products', {
			name: 'Snapshot product',
			slug: 'snapshot-product',
			description: 'Original details',
			priceInCents: 1299,
			categoryId,
			images: [],
			imageKeys: [],
			storagePrefix: 'products',
			status: 'active'
		});
	});
	const input = {
		retryKey: 'stable-checkout-key',
		items: [{ productId, quantity: 2 }],
		firstName: 'Ada',
		lastName: 'Lovelace',
		email: 'ada@example.com',
		phone: '+1 555 0100',
		fulfillmentMethod: 'pickup' as const
	};
	const orderId = await t.mutation(api.tables.orders.mutations.createOrder.createOrder, input);
	expect(await t.mutation(api.tables.orders.mutations.createOrder.createOrder, input)).toBe(
		orderId
	);

	const snapshot = await t.run(async (ctx) => ({
		order: await ctx.db.get(orderId),
		items: await ctx.db
			.query('orderItems')
			.withIndex('by_order_id', (query) => query.eq('orderId', orderId))
			.collect()
	}));
	expect(snapshot.order).toMatchObject({ subtotalInCents: 2598, totalInCents: 2598 });
	expect(snapshot.items).toEqual([
		expect.objectContaining({ name: 'Snapshot product', unitPriceInCents: 1299, quantity: 2 })
	]);

	await expect(
		t.mutation(api.tables.orders.mutations.createOrder.createOrder, {
			...input,
			items: [{ productId, quantity: 3 }]
		})
	).rejects.toMatchObject({ data: { code: 'ORDER_RETRY_CONFLICT' } });
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
			retryKey: 'admin-order',
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
		action: 'request_refund'
	});

	expect(await t.run((ctx) => ctx.db.get(orderId))).toMatchObject({
		paymentStatus: 'refund_pending',
		fulfillmentStatus: 'fulfilled'
	});
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
			retryKey: 'matching-order',
			email: 'matching@example.com',
			paymentStatus: 'paid',
			fulfillmentStatus: 'fulfilled',
			fulfillmentMethod: 'delivery'
		});
		await ctx.db.insert('orders', {
			...order,
			retryKey: 'newer-nonmatching-order',
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
