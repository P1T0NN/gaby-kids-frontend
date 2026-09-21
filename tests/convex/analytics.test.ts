/// <reference types="vite/client" />

import aggregateTest from '@convex-dev/aggregate/test';
import { convexTest } from 'convex-test';
import { expect, test, vi } from 'vitest';

import { api } from '../../src/convex/_generated/api';
import schema from '../../src/convex/schema';
import { aggregateTriggers } from '../../src/convex/aggregates/triggersAggregate';
import { getDashboardStats } from '../../src/convex/analytics/helpers/getDashboardStats';

// TYPES
import type { Doc } from '../../src/convex/_generated/dataModel';

const modules = import.meta.glob('../../src/convex/**/*.ts');
const DAY_IN_MS = 86_400_000;
const RANGE_START = Date.UTC(2026, 0, 1);
const HOUR_IN_MS = 3_600_000;

const adminIdentity = {
	tokenIdentifier: 'analytics-admin',
	subject: 'analytics-admin',
	role: 'admin'
};

type SeedOrder = {
	code: string;
	createdAt: number;
	paymentStatus: Doc<'orders'>['paymentStatus'];
	totalInCents: number;
};

function createTestContext() {
	const t = convexTest(schema, modules);
	aggregateTest.register(t, 'ordersAggregate');
	return t;
}

async function seedOrder(t: ReturnType<typeof convexTest>, seed: SeedOrder): Promise<void> {
	vi.setSystemTime(seed.createdAt);
	const order = {
		customerId: 'cust_1',
		code: seed.code,
		receiptToken: `receipt-${seed.code}`,
		lineFingerprint: seed.code,
		currency: 'usd',
		firstName: 'Ada',
		lastName: 'Lovelace',
		email: 'ada@example.com',
		phone: '123',
		fulfillmentMethod: 'pickup' as const,
		subtotalInCents: seed.totalInCents,
		totalInCents: seed.totalInCents,
		paymentStatus: seed.paymentStatus,
		fulfillmentStatus: 'unfulfilled' as const,
		updatedAt: seed.createdAt
	};

	await t.run(async (ctx) => {
		const { db } = aggregateTriggers.wrapDB(ctx);
		await db.insert('orders', order);
	});
}

async function seedOrders(
	t: ReturnType<typeof convexTest>,
	extra: SeedOrder[] = []
): Promise<void> {
	const seeds: SeedOrder[] = [
		{
			code: 'ORD-00001',
			createdAt: RANGE_START - 2 * DAY_IN_MS,
			paymentStatus: 'paid',
			totalInCents: 500
		},
		{
			code: 'ORD-00002',
			createdAt: RANGE_START,
			paymentStatus: 'paid',
			totalInCents: 1000
		},
		{
			code: 'ORD-00003',
			createdAt: RANGE_START + 2 * DAY_IN_MS,
			paymentStatus: 'paid',
			totalInCents: 2000
		},
		{
			code: 'ORD-00004',
			createdAt: RANGE_START + 3 * DAY_IN_MS,
			paymentStatus: 'refunded',
			totalInCents: 5000
		},
		{
			code: 'ORD-00005',
			createdAt: RANGE_START + 10 * DAY_IN_MS,
			paymentStatus: 'paid',
			totalInCents: 500
		},
		...extra
	];

	for (const seed of seeds.sort((left, right) => left.createdAt - right.createdAt)) {
		await seedOrder(t, seed);
	}
}

test('aggregates revenue, orders, and average order value for the range', async () => {
	vi.useFakeTimers();
	try {
		const t = createTestContext();
		await seedOrders(t);

		const stats = await t.run((ctx) =>
			getDashboardStats(ctx, {
				from: RANGE_START,
				to: RANGE_START + 3 * DAY_IN_MS
			})
		);

		expect(stats).toEqual({
			revenue: 3000,
			orders: 3,
			averageOrderValue: 1500
		});
	} finally {
		vi.useRealTimers();
	}
});

test('rejects unauthenticated and non-admin dashboard reads', async () => {
	const t = createTestContext();
	const args = {
		current: { from: RANGE_START, to: RANGE_START + DAY_IN_MS },
		previous: { from: RANGE_START - DAY_IN_MS, to: RANGE_START - 1 }
	};

	await expect(
		t.query(api.analytics.queries.fetchDashboard.fetchDashboard, args)
	).rejects.toMatchObject({ data: { code: 'UNAUTHENTICATED' } });

	const user = t.withIdentity({ tokenIdentifier: 'analytics-user', subject: 'analytics-user' });
	await expect(
		user.query(api.analytics.queries.fetchDashboard.fetchDashboard, args)
	).rejects.toMatchObject({ data: { code: 'FORBIDDEN' } });
});

test('returns current and previous period stats for admins', async () => {
	vi.useFakeTimers();
	try {
		const t = createTestContext();
		await seedOrders(t);

		const admin = t.withIdentity(adminIdentity);
		const comparison = await admin.query(api.analytics.queries.fetchDashboard.fetchDashboard, {
			current: { from: RANGE_START, to: RANGE_START + 3 * DAY_IN_MS },
			previous: { from: RANGE_START - 3 * DAY_IN_MS, to: RANGE_START - 1 }
		});

		expect(comparison.current).toEqual({
			revenue: 3000,
			orders: 3,
			averageOrderValue: 1500
		});
		expect(comparison.previous).toEqual({
			revenue: 500,
			orders: 1,
			averageOrderValue: 500
		});

		await expect(
			admin.query(api.analytics.queries.fetchDashboard.fetchDashboard, {
				current: { from: RANGE_START + DAY_IN_MS, to: RANGE_START },
				previous: { from: RANGE_START - DAY_IN_MS, to: RANGE_START - 1 }
			})
		).rejects.toThrow('Invalid dashboard date range');
	} finally {
		vi.useRealTimers();
	}
});

test('compares partial ranges against full previous days', async () => {
	vi.useFakeTimers();
	try {
		const t = createTestContext();
		await seedOrders(t, [
			{
				code: 'ORD-00006',
				createdAt: RANGE_START - 16 * HOUR_IN_MS,
				paymentStatus: 'paid',
				totalInCents: 700
			}
		]);

		const admin = t.withIdentity(adminIdentity);
		const comparison = await admin.query(api.analytics.queries.fetchDashboard.fetchDashboard, {
			current: { from: RANGE_START, to: RANGE_START + 12 * HOUR_IN_MS },
			previous: { from: RANGE_START - DAY_IN_MS, to: RANGE_START - 1 }
		});

		expect(comparison.current).toEqual({
			revenue: 1000,
			orders: 1,
			averageOrderValue: 1000
		});
		expect(comparison.previous).toEqual({
			revenue: 700,
			orders: 1,
			averageOrderValue: 700
		});
	} finally {
		vi.useRealTimers();
	}
});

test('returns an empty previous window when the range has no prior data', async () => {
	vi.useFakeTimers();
	try {
		const t = createTestContext();
		await seedOrders(t);

		const admin = t.withIdentity(adminIdentity);
		const comparison = await admin.query(api.analytics.queries.fetchDashboard.fetchDashboard, {
			current: { from: RANGE_START, to: RANGE_START + DAY_IN_MS },
			previous: { from: RANGE_START - DAY_IN_MS, to: RANGE_START - 1 }
		});

		expect(comparison.current).toEqual({
			revenue: 1000,
			orders: 1,
			averageOrderValue: 1000
		});
		expect(comparison.previous).toEqual({
			revenue: 0,
			orders: 0,
			averageOrderValue: 0
		});
	} finally {
		vi.useRealTimers();
	}
});

test('returns a zero-filled daily revenue series for the range', async () => {
	vi.useFakeTimers();
	try {
		const t = createTestContext();
		await seedOrders(t);

		const admin = t.withIdentity(adminIdentity);
		const series = await admin.query(api.analytics.queries.fetchRevenueSeries.fetchRevenueSeries, {
			from: RANGE_START,
			to: RANGE_START + 3 * DAY_IN_MS
		});

		expect(series).toEqual([
			{ date: RANGE_START, revenue: 1000 },
			{ date: RANGE_START + DAY_IN_MS, revenue: 0 },
			{ date: RANGE_START + 2 * DAY_IN_MS, revenue: 2000 },
			{ date: RANGE_START + 3 * DAY_IN_MS, revenue: 0 }
		]);
	} finally {
		vi.useRealTimers();
	}
});

test('keeps the daily rollup in sync when an order is deleted', async () => {
	vi.useFakeTimers();
	try {
		const t = createTestContext();
		await seedOrders(t);

		await t.run(async (ctx) => {
			const { db } = aggregateTriggers.wrapDB(ctx);
			const order = await db
				.query('orders')
				.withIndex('by_code', (q) => q.eq('code', 'ORD-00002'))
				.unique();
			if (order) await db.delete(order._id);
		});

		const stats = await t.run((ctx) =>
			getDashboardStats(ctx, {
				from: RANGE_START,
				to: RANGE_START + 3 * DAY_IN_MS
			})
		);

		expect(stats).toEqual({
			revenue: 2000,
			orders: 2,
			averageOrderValue: 2000
		});
	} finally {
		vi.useRealTimers();
	}
});

test('restates revenue when an order is refunded or cancelled', async () => {
	vi.useFakeTimers();
	try {
		const t = createTestContext();
		await seedOrder(t, {
			code: 'ORD-00007',
			createdAt: RANGE_START,
			paymentStatus: 'paid',
			totalInCents: 2500
		});

		const bounds = { from: RANGE_START, to: RANGE_START + DAY_IN_MS - 1 };

		await t.run(async (ctx) => {
			const { db } = aggregateTriggers.wrapDB(ctx);
			const order = await db
				.query('orders')
				.withIndex('by_code', (q) => q.eq('code', 'ORD-00007'))
				.unique();
			if (order) await db.patch(order._id, { paymentStatus: 'refunded' });
		});

		expect(await t.run((ctx) => getDashboardStats(ctx, bounds))).toEqual({
			revenue: 0,
			orders: 1,
			averageOrderValue: 0
		});

		await t.run(async (ctx) => {
			const { db } = aggregateTriggers.wrapDB(ctx);
			const order = await db
				.query('orders')
				.withIndex('by_code', (q) => q.eq('code', 'ORD-00007'))
				.unique();
			if (order) await db.patch(order._id, { paymentStatus: 'paid', cancelledAt: Date.now() });
		});

		expect(await t.run((ctx) => getDashboardStats(ctx, bounds))).toEqual({
			revenue: 0,
			orders: 1,
			averageOrderValue: 0
		});
	} finally {
		vi.useRealTimers();
	}
});
