/// <reference types="vite/client" />

import aggregateTest from '@convex-dev/aggregate/test';
import rateLimiterTest from '@convex-dev/rate-limiter/test';
import { convexTest } from 'convex-test';
import { expect, test } from 'vitest';

import { api, internal } from '../../src/convex/_generated/api';
import schema from '../../src/convex/schema';
import { markEmailClaimPending } from '../../src/convex/tables/customerEmailClaims/helpers/markEmailClaimPending';

const modules = import.meta.glob('../../src/convex/**/*.ts');

const claim = api.tables.customerLinks.mutations.claimCustomerOrders.claimCustomerOrders;
const LOCAL_CUSTOMER_ID = '00000000-0000-4000-8000-000000000010';
const OTHER_LOCAL_CUSTOMER_ID = '00000000-0000-4000-8000-000000000011';

function createTestContext() {
	const t = convexTest(schema, modules);
	aggregateTest.register(t, 'ordersAggregate');
	rateLimiterTest.register(t);
	return t;
}

function insertOrder(
	t: ReturnType<typeof createTestContext>,
	customerId: string | undefined,
	code: string,
	email = 'ada@example.com'
): Promise<string> {
	return t.run((ctx) => {
		const order = {
			code,
			receiptToken: `receipt-${code}`,
			lineFingerprint: code,
			currency: 'usd',
			firstName: 'Ada',
			lastName: 'Lovelace',
			email,
			phone: '123',
			fulfillmentMethod: 'pickup' as const,
			subtotalInCents: 1000,
			totalInCents: 1000,
			paymentStatus: 'paid' as const,
			fulfillmentStatus: 'unfulfilled' as const,
			updatedAt: 1
		};

		if (customerId === undefined) return ctx.db.insert('orders', order);
		return ctx.db.insert('orders', { ...order, customerId });
	});
}

test('claiming a local customer links it once and moves its orders to the account', async () => {
	const t = createTestContext();
	await insertOrder(t, LOCAL_CUSTOMER_ID, 'LOCAL1');
	await insertOrder(t, LOCAL_CUSTOMER_ID, 'LOCAL2');
	await insertOrder(t, 'someone-else', 'OTHER1');

	const user = t.withIdentity({ subject: 'user-1', tokenIdentifier: 'issuer|user-1' });
	expect(await user.mutation(claim, { localCustomerId: LOCAL_CUSTOMER_ID })).toBe(2);
	expect(await user.mutation(claim, { localCustomerId: LOCAL_CUSTOMER_ID })).toBe(0);

	await t.run(async (ctx) => {
		const orders = await ctx.db.query('orders').collect();
		expect(orders.filter((order) => order.customerId === 'user-1')).toHaveLength(2);
		expect(orders.filter((order) => order.customerId === 'someone-else')).toHaveLength(1);
		expect(await ctx.db.query('customerLinks').collect()).toMatchObject([
			{ localCustomerId: LOCAL_CUSTOMER_ID, customerId: 'user-1' }
		]);
	});
});

test('another account cannot claim a local customer that is already linked', async () => {
	const t = createTestContext();
	await insertOrder(t, LOCAL_CUSTOMER_ID, 'LOCAL1');

	const first = t.withIdentity({ subject: 'user-1', tokenIdentifier: 'issuer|user-1' });
	const second = t.withIdentity({ subject: 'user-2', tokenIdentifier: 'issuer|user-2' });
	expect(await first.mutation(claim, { localCustomerId: LOCAL_CUSTOMER_ID })).toBe(1);
	expect(await second.mutation(claim, { localCustomerId: LOCAL_CUSTOMER_ID })).toBe(0);

	await t.run(async (ctx) => {
		const order = await ctx.db.query('orders').unique();
		expect(order?.customerId).toBe('user-1');
		expect(await ctx.db.query('customerLinks').take(2)).toHaveLength(1);
	});
});

test('a malformed local customer id is ignored', async () => {
	const t = createTestContext();
	const user = t.withIdentity({ subject: 'user-1', tokenIdentifier: 'issuer|user-1' });

	expect(await user.mutation(claim, { localCustomerId: 'not-a-uuid' })).toBe(0);
	expect(await t.run((ctx) => ctx.db.query('customerLinks').take(1))).toEqual([]);
});

test('the verified email owner takes orders back from the device account', async () => {
	const t = createTestContext();
	await insertOrder(t, LOCAL_CUSTOMER_ID, 'LOCAL1');
	await insertOrder(t, undefined, 'UNCLAIMED1');

	const device = t.withIdentity({
		subject: 'device-owner',
		tokenIdentifier: 'issuer|device-owner'
	});
	expect(await device.mutation(claim, { localCustomerId: LOCAL_CUSTOMER_ID })).toBe(1);

	const owner = t.withIdentity({
		subject: 'email-owner',
		tokenIdentifier: 'issuer|email-owner',
		email: 'ada@example.com'
	});
	expect(await owner.mutation(claim, { localCustomerId: OTHER_LOCAL_CUSTOMER_ID })).toBe(2);

	await t.run(async (ctx) => {
		const orders = await ctx.db.query('orders').collect();
		expect(orders).toHaveLength(2);
		expect(orders.every((order) => order.customerId === 'email-owner')).toBe(true);
	});
});

test('an account with a different email cannot take email orders', async () => {
	const t = createTestContext();
	await insertOrder(t, undefined, 'UNCLAIMED1');

	const stranger = t.withIdentity({
		subject: 'stranger',
		tokenIdentifier: 'issuer|stranger',
		email: 'other@example.com'
	});
	expect(await stranger.mutation(claim, { localCustomerId: OTHER_LOCAL_CUSTOMER_ID })).toBe(0);

	await t.run(async (ctx) => {
		const order = await ctx.db.query('orders').unique();
		expect(order?.customerId).toBeUndefined();
	});
});

test('the email scan only runs while the pending marker is ahead', async () => {
	const t = createTestContext();
	await insertOrder(t, undefined, 'FIRST1');

	const owner = t.withIdentity({
		subject: 'email-owner',
		tokenIdentifier: 'issuer|email-owner',
		email: 'ada@example.com'
	});
	expect(await owner.mutation(claim, { localCustomerId: OTHER_LOCAL_CUSTOMER_ID })).toBe(1);

	let marker = await t.run((ctx) => ctx.db.query('customerEmailClaims').unique());
	expect(marker).toMatchObject({ pendingRevision: 1, scannedRevision: 1 });

	// Nothing changed since the scan, so the same claim transfers nothing.
	expect(await owner.mutation(claim, { localCustomerId: OTHER_LOCAL_CUSTOMER_ID })).toBe(0);

	await t.run((ctx) => markEmailClaimPending(ctx, 'ada@example.com'));
	await insertOrder(t, undefined, 'SECOND1');
	expect(await owner.mutation(claim, { localCustomerId: OTHER_LOCAL_CUSTOMER_ID })).toBe(1);

	marker = await t.run((ctx) => ctx.db.query('customerEmailClaims').unique());
	expect(marker).toMatchObject({ pendingRevision: 2, scannedRevision: 2 });
});

test('deleting a user clears device links and the email marker', async () => {
	const t = createTestContext();
	await t.run(async (ctx) => {
		await ctx.db.insert('customerLinks', {
			localCustomerId: LOCAL_CUSTOMER_ID,
			customerId: 'user-1',
			linkedAt: 1
		});
		await ctx.db.insert('customerEmailClaims', {
			email: 'ada@example.com',
			pendingRevision: 1,
			scannedRevision: 1
		});
	});

	await t.mutation(internal.betterAuth.cleanupDeletedUserData.cleanupDeletedUserData, {
		ownerId: 'user-1',
		email: 'ada@example.com'
	});

	await t.run(async (ctx) => {
		expect(await ctx.db.query('customerLinks').take(1)).toEqual([]);
		expect(await ctx.db.query('customerEmailClaims').take(1)).toEqual([]);
	});
});
