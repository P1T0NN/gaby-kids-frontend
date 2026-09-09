/// <reference types="vite/client" />

import aggregateTest from '@convex-dev/aggregate/test';
import rateLimiterTest from '@convex-dev/rate-limiter/test';
import analyticsTest from '@vllnt/convex-analytics/test';
import { convexTest } from 'convex-test';
import { expect, test } from 'vitest';

import { api, components } from '../../src/convex/_generated/api';
import schema from '../../src/convex/schema';

const modules = import.meta.glob('../../src/convex/**/*.ts');

test('product detail resolves bounded, ordered, active recommendations for guests', async () => {
	const t = convexTest(schema, modules);
	const ids = await t.run(async (ctx) => {
		const categoryId = await ctx.db.insert('categories', {
			name: 'Accessories',
			slug: 'accessories',
			status: 'active'
		});
		const ids = [];
		for (let index = 0; index < 7; index++) {
			ids.push(
				await ctx.db.insert('products', {
					name: `Product ${index}`,
					slug: `detail-${index}`,
					description: 'Description',
					priceInCents: 1200 + index,
					categoryId,
					images: [],
					imageKeys: ['https://example.com/first.jpg', 'https://example.com/second.jpg'],
					storagePrefix: 'products',
					status: 'active'
				})
			);
		}
		await ctx.db.patch('products', ids[0], {
			upsellProductIds: [ids[3], ids[1], ids[2], ids[4], ids[5]]
		});
		await ctx.db.patch('products', ids[3], { upsellProductIds: [ids[0]] });
		await ctx.db.patch('products', ids[2], { status: 'draft' });
		await ctx.db.delete('products', ids[4]);
		return ids;
	});
	const query = api.tables.products.queries.fetchProductBySlug.fetchProductBySlug;
	const upsellsQuery = api.tables.upsells.queries.fetchProductUpsells.fetchProductUpsells;
	const result = await t.query(query, { slug: 'detail-0' });
	expect(result?.upsells).toEqual(
		[3, 1].map((index) => ({
			_id: ids[index],
			name: `Product ${index}`,
			slug: `detail-${index}`,
			priceInCents: 1200 + index,
			images: ['https://example.com/first.jpg']
		}))
	);
	expect((await t.query(upsellsQuery, { productId: ids[0] })).map((item) => item._id)).toEqual([
		ids[3],
		ids[1]
	]);
	expect((await t.query(query, { slug: 'detail-6' }))?.upsells).toEqual([]);
	await t.run(async (ctx) => {
		await ctx.db.patch('products', ids[0], { upsellProductIds: [ids[0], ids[1], ids[3]] });
		await ctx.db.patch('products', ids[1], { status: 'archived' });
	});
	expect((await t.query(query, { slug: 'detail-0' }))?.upsells.map((item) => item._id)).toEqual([
		ids[3]
	]);
	await t.run(async (ctx) => {
		await ctx.db.patch('products', ids[0], { status: 'archived' });
	});
	expect(await t.query(query, { slug: 'detail-0' })).toBeNull();
	expect(await t.query(upsellsQuery, { productId: ids[0] })).toEqual([]);
	expect(await t.query(query, { slug: 'detail-2' })).toBeNull();
	expect(await t.query(query, { slug: 'missing' })).toBeNull();
});

test('admins manage ordered upsells and edit data stays consistent', async () => {
	const t = convexTest(schema, modules);
	aggregateTest.register(t, 'productsAggregate');
	aggregateTest.register(t, 'categoriesAggregate');
	rateLimiterTest.register(t);
	const admin = t.withIdentity({
		subject: 'upsells-admin',
		tokenIdentifier: 'upsells-admin',
		role: 'admin'
	});
	const user = t.withIdentity({ subject: 'upsells-user', tokenIdentifier: 'upsells-user' });
	const ids = await t.run(async (ctx) => {
		const categoryId = await ctx.db.insert('categories', {
			name: 'Accessories',
			slug: 'accessories',
			status: 'active'
		});
		const productIds = [];
		for (let index = 0; index < 7; index++) {
			productIds.push(
				await ctx.db.insert('products', {
					name: `Product ${index}`,
					slug: `product-${index}`,
					description: 'Unchanged description',
					priceInCents: 1200 + index,
					categoryId,
					images: [],
					imageKeys: [],
					storagePrefix: 'products',
					status: index === 6 ? 'draft' : 'active'
				})
			);
		}
		return productIds;
	});
	const [productId, first, second, third, fourth, fifth, draft] = ids;
	const save = api.tables.upsells.mutations.saveProductUpsells.saveProductUpsells;
	const adminRead = api.tables.upsells.queries.fetchUpsellForEdit.fetchUpsellForEdit;
	const adminList = api.tables.upsells.queries.fetchUpsellsAdmin.fetchUpsellsAdmin;
	const input = { productId, upsellProductIds: [second, first] };

	await expect(t.mutation(save, input)).rejects.toMatchObject({
		data: { code: 'UNAUTHENTICATED' }
	});
	await expect(user.mutation(save, input)).rejects.toMatchObject({ data: { code: 'FORBIDDEN' } });
	await expect(user.query(adminRead, { productId })).rejects.toMatchObject({
		data: { code: 'FORBIDDEN' }
	});
	await admin.mutation(save, input);
	expect((await admin.query(adminRead, { productId })).upsells.map((item) => item._id)).toEqual([
		second,
		first
	]);
	const listed = await admin.query(adminList, {
		paginationOpts: { cursor: null, numItems: 10 }
	});
	expect(listed.items[0].product._id).toBe(productId);
	expect(listed.items[0].upsells.map((item) => item.productId)).toEqual([second, first]);
	await t.run(async (ctx) => {
		expect(await ctx.db.get('products', productId)).toMatchObject({
			description: 'Unchanged description',
			priceInCents: 1200,
			upsellProductIds: [second, first]
		});
		const scheduled = await ctx.db.system.query('_scheduled_functions').take(20);
		expect(scheduled).toHaveLength(1);
		expect(scheduled[0].name).toContain('writeAuditEvent');
	});

	for (const upsellProductIds of [
		[first, first],
		[productId],
		[first, second, third, fourth, fifth]
	]) {
		await expect(admin.mutation(save, { productId, upsellProductIds })).rejects.toMatchObject({
			data: { code: 'INVALID_UPSELL_DATA' }
		});
	}
	await expect(
		admin.mutation(save, { productId, upsellProductIds: [draft] })
	).rejects.toMatchObject({ data: { code: 'UPSELL_PRODUCT_UNAVAILABLE' } });
	expect((await admin.query(adminRead, { productId })).upsells.map((item) => item._id)).toEqual([
		second,
		first
	]);

	await admin.mutation(save, { productId, upsellProductIds: [fourth, third, second, first] });
	await t.run(async (ctx) => {
		await ctx.db.patch('products', second, { status: 'archived' });
		await ctx.db.delete('products', first);
	});
	const editor = await admin.query(adminRead, { productId });
	expect(editor.upsells.map((product) => product._id)).toEqual([fourth, third]);
	await expect(
		admin.mutation(save, { productId, upsellProductIds: [first] })
	).rejects.toMatchObject({ data: { code: 'UPSELL_PRODUCT_UNAVAILABLE' } });
	await admin.mutation(save, { productId, upsellProductIds: [] });
	expect((await admin.query(adminRead, { productId })).upsells).toEqual([]);

	await admin.mutation(save, { productId: draft, upsellProductIds: [third] });
	await expect(
		admin.mutation(save, { productId: first, upsellProductIds: [] })
	).rejects.toMatchObject({ data: { code: 'PRODUCT_NOT_FOUND' } });
});

test('storefront upsell events track only valid product relationships', async () => {
	const t = convexTest(schema, modules);
	analyticsTest.register(t);
	const [sourceProductId, upsellProductId, unrelatedProductId] = await t.run(async (ctx) => {
		const categoryId = await ctx.db.insert('categories', {
			name: 'Accessories',
			slug: 'analytics-accessories',
			status: 'active'
		});
		const productIds = await Promise.all(
			['Source', 'Upsell', 'Unrelated'].map((name, index) =>
				ctx.db.insert('products', {
					name,
					slug: `analytics-${index}`,
					description: 'Description',
					priceInCents: 1200 + index,
					categoryId,
					images: [],
					imageKeys: [],
					storagePrefix: 'products',
					status: 'active'
				})
			)
		);
		await ctx.db.patch('products', productIds[0], { upsellProductIds: [productIds[1]] });
		return productIds;
	});
	const track = api.tables.upsells.mutations.trackUpsellEvent.trackUpsellEvent;
	const sessionRef = 'test-upsell-session';

	await t.mutation(track, { event: 'dialog_viewed', sourceProductId, sessionRef });
	await t.mutation(track, {
		event: 'product_added',
		sourceProductId,
		upsellProductId,
		sessionRef
	});
	await t.mutation(track, {
		event: 'product_added',
		sourceProductId,
		upsellProductId: unrelatedProductId,
		sessionRef
	});

	expect(
		await t.query(components.analytics.queries.metric, {
			scope: 'default',
			name: 'upsell:dialog_viewed'
		})
	).toBe(1);
	expect(
		await t.query(components.analytics.queries.metric, {
			scope: 'default',
			name: 'upsell:product_added',
			where: { dim: 'upsellProductId', val: upsellProductId }
		})
	).toBe(1);
});
