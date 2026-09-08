/// <reference types="vite/client" />

import aggregateTest from '@convex-dev/aggregate/test';
import rateLimiterTest from '@convex-dev/rate-limiter/test';
import { convexTest } from 'convex-test';
import { expect, test } from 'vitest';

import { api } from '../../src/convex/_generated/api';
import schema from '../../src/convex/schema';

const modules = import.meta.glob('../../src/convex/**/*.ts');

test('admins manage ordered upsells, while public reads expose only active recommendations', async () => {
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
	const adminRead = api.tables.upsells.queries.fetchProductUpsellsAdmin.fetchProductUpsellsAdmin;
	const publicRead = api.tables.upsells.queries.fetchProductUpsells.fetchProductUpsells;
	const input = { productId, upsellProductIds: [second, first] };

	await expect(t.mutation(save, input)).rejects.toMatchObject({
		data: { code: 'UNAUTHENTICATED' }
	});
	await expect(user.mutation(save, input)).rejects.toMatchObject({ data: { code: 'FORBIDDEN' } });
	await expect(user.query(adminRead, { productId })).rejects.toMatchObject({
		data: { code: 'FORBIDDEN' }
	});
	expect(await t.query(publicRead, { productId })).toEqual([]);
	await admin.mutation(save, input);
	expect(
		(await admin.query(adminRead, { productId })).upsells.map((item) => item.productId)
	).toEqual([second, first]);
	expect((await t.query(publicRead, { productId })).map((product) => product._id)).toEqual([
		second,
		first
	]);
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
	expect(
		(await admin.query(adminRead, { productId })).upsells.map((item) => item.productId)
	).toEqual([second, first]);

	await admin.mutation(save, { productId, upsellProductIds: [fourth, third, second, first] });
	expect((await t.query(publicRead, { productId })).map((product) => product._id)).toEqual([
		fourth,
		third,
		second,
		first
	]);
	await t.run(async (ctx) => {
		await ctx.db.patch('products', second, { status: 'archived' });
		await ctx.db.delete('products', first);
	});
	expect((await t.query(publicRead, { productId })).map((product) => product._id)).toEqual([
		fourth,
		third
	]);
	const editor = await admin.query(adminRead, { productId });
	expect(editor.upsells[2].product?.status).toBe('archived');
	expect(editor.upsells[3]).toEqual({ productId: first, product: null });
	await expect(
		admin.mutation(save, { productId, upsellProductIds: [first] })
	).rejects.toMatchObject({ data: { code: 'UPSELL_PRODUCT_UNAVAILABLE' } });
	await admin.mutation(save, { productId, upsellProductIds: [] });
	expect((await admin.query(adminRead, { productId })).upsells).toEqual([]);

	await admin.mutation(save, { productId: draft, upsellProductIds: [third] });
	expect(await t.query(publicRead, { productId: draft })).toEqual([]);
	await expect(
		admin.mutation(save, { productId: first, upsellProductIds: [] })
	).rejects.toMatchObject({ data: { code: 'PRODUCT_NOT_FOUND' } });
	expect(await t.query(publicRead, { productId: first })).toEqual([]);
});
