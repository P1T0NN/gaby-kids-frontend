/// <reference types="vite/client" />

import aggregateTest from '@convex-dev/aggregate/test';
import actionRetrierTest from '@convex-dev/action-retrier/test';
import rateLimiterTest from '@convex-dev/rate-limiter/test';
import r2Test from '@convex-dev/r2/test';
import auditLogTest from 'convex-audit-log/test';
import { convexTest } from 'convex-test';
import type { FunctionReturnType } from 'convex/server';
import { expect, test, vi } from 'vitest';

import { api } from '../../src/convex/_generated/api';
import schema from '../../src/convex/schema';

const modules = import.meta.glob('../../src/convex/**/*.ts');

test('cart returns names and identifies missing, malformed, wrong-table and unpublished IDs', async () => {
	const t = createTestContext();
	const ids = await t.run(async (ctx) => {
		const categoryId = await ctx.db.insert('categories', {
			name: 'Cart',
			slug: 'cart',
			status: 'active'
		});
		const products = [];
		for (const status of ['active', 'active', 'draft', 'archived', 'active'] as const) {
			products.push(
				await ctx.db.insert('products', {
					name: `Product ${products.length}`,
					slug: `cart-${products.length}`,
					description: '',
					priceInCents: 100,
					categoryId,
					images: [],
					imageKeys: [],
					storagePrefix: 'products',
					trackInventory: true,
					inventory: 0,
					reservedInventory: 0,
					upsellProductIds: [],
					status
				})
			);
		}
		await ctx.db.delete('products', products[4]);
		return { products, categoryId };
	});
	const query = api.tables.products.queries.fetchCart.fetchCart;
	const result = await t.query(query, {
		ids: [...ids.products, 'invalid', ids.categoryId, ids.products[0]]
	});
	expect(result.products).toEqual([
		{
			id: ids.products[0],
			name: 'Product 0',
			priceInCents: 100,
			trackInventory: true,
			inventory: 0,
			reservedInventory: 0
		},
		{
			id: ids.products[1],
			name: 'Product 1',
			priceInCents: 100,
			trackInventory: true,
			inventory: 0,
			reservedInventory: 0
		}
	]);
	expect(result.invalidIds).toEqual([...ids.products.slice(2), 'invalid', ids.categoryId]);
	expect(await t.query(query, { ids: [] })).toEqual({ products: [], invalidIds: [] });
	await expect(t.query(query, { ids: Array(51).fill('invalid') })).rejects.toThrow();
});

test('shop filters combine with search and pagination without exposing unpublished products', async () => {
	const t = createTestContext();
	const asOf = Date.now();
	vi.useFakeTimers();
	try {
		vi.setSystemTime(asOf - 40 * 24 * 60 * 60 * 1000);
		const categoryId = await t.run((ctx) =>
			ctx.db.insert('categories', {
				name: 'Shop test',
				slug: 'shop-test',
				status: 'active'
			})
		);
		await t.run((ctx) =>
			ctx.db.insert('products', {
				name: 'Canvas old',
				slug: 'canvas-old',
				description: 'Older product',
				priceInCents: 100,
				categoryId,
				images: [],
				imageKeys: [],
				storagePrefix: 'products',
				trackInventory: true,
				inventory: 0,
				reservedInventory: 0,
				upsellProductIds: [],
				status: 'active'
			})
		);
		vi.setSystemTime(asOf);
		await t.run(async (ctx) => {
			for (const status of ['active', 'draft', 'archived'] as const) {
				await ctx.db.insert('products', {
					name: `Canvas ${status}`,
					slug: `canvas-${status}`,
					description: 'Photo product',
					priceInCents: 100,
					categoryId,
					images: ['https://example.com/photo.jpg'],
					imageKeys: ['https://example.com/photo.jpg'],
					storagePrefix: 'products',
					trackInventory: true,
					inventory: 0,
					reservedInventory: 0,
					upsellProductIds: [],
					status
				});
			}
			await ctx.db.insert('products', {
				name: 'Canvas cleared',
				slug: 'canvas-cleared',
				description: 'Removed photos',
				priceInCents: 100,
				categoryId,
				images: ['https://example.com/old.jpg'],
				imageKeys: [],
				storagePrefix: 'products',
				trackInventory: true,
				inventory: 0,
				reservedInventory: 0,
				upsellProductIds: [],
				status: 'active'
			});
			await ctx.db.insert('products', {
				name: 'Canvas plain',
				slug: 'canvas-plain',
				description: 'No photos',
				priceInCents: 100,
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
		const query = api.tables.products.queries.fetchAllProductsPublic.fetchAllProductsPublic;
		const withPhotos = await t.query(query, {
			paginationOpts: { cursor: null, numItems: 12 },
			filters: { photos: 'with' },
			search: 'Canvas'
		});
		expect(withPhotos.items.map((product) => product.name)).toEqual(['Canvas active']);
		expect(withPhotos.total).toBeUndefined();
		const recent = await t.query(query, {
			paginationOpts: { cursor: null, numItems: 12 },
			filters: { added: '30d' },
			asOf
		});
		expect(recent.items.map((product) => product.name).sort()).toEqual([
			'Canvas active',
			'Canvas cleared',
			'Canvas plain'
		]);
		const names: string[] = [];
		let cursor: string | null = null;
		for (let page = 0; page < 10; page++) {
			const result: FunctionReturnType<typeof query> = await t.query(query, {
				paginationOpts: { cursor, numItems: 1 },
				filters: { photos: 'without', added: '30d' },
				search: 'Canvas',
				asOf
			});
			names.push(...result.items.map((product) => product.name));
			cursor = result.nextCursor;
			if (!cursor) break;
		}
		expect(cursor).toBeNull();
		expect(names.sort()).toEqual(['Canvas cleared', 'Canvas plain']);
	} finally {
		vi.useRealTimers();
	}
});

function createTestContext() {
	const t = convexTest(schema, modules);
	aggregateTest.register(t, 'productsAggregate');
	aggregateTest.register(t, 'categoriesAggregate');
	rateLimiterTest.register(t);
	auditLogTest.register(t);
	r2Test.register(t);
	actionRetrierTest.register(t, 'r2/actionRetrier');
	return t;
}

test('allows only admins to create and list valid products', async () => {
	const t = createTestContext();
	const user = t.withIdentity({ tokenIdentifier: 'product-user', subject: 'product-user' });
	const admin = t.withIdentity({
		tokenIdentifier: 'product-admin',
		subject: 'product-admin',
		role: 'admin'
	});
	const category = await admin.mutation(
		api.tables.categories.mutations.createCategory.createCategory,
		{ name: 'Products test', status: 'active' }
	);

	await expect(
		user.mutation(api.tables.products.mutations.saveProduct.saveProduct, {
			name: 'Forbidden product',
			description: 'Users cannot create products.',
			priceInCents: 100,
			trackInventory: true,
			inventory: 0,
			categoryId: category._id
		})
	).rejects.toMatchObject({ data: { code: 'FORBIDDEN' } });

	await expect(
		admin.mutation(api.tables.products.mutations.saveProduct.saveProduct, {
			name: '',
			description: 'A product name is required.',
			priceInCents: 100,
			trackInventory: true,
			inventory: 0,
			categoryId: category._id
		})
	).rejects.toMatchObject({ data: { code: 'INVALID_PRODUCT_DATA' } });

	const created = await admin.mutation(api.tables.products.mutations.saveProduct.saveProduct, {
		name: 'Canvas backpack',
		description: 'A durable everyday backpack.',
		priceInCents: 100,
		trackInventory: true,
		inventory: 5,
		categoryId: category._id
	});
	const page = await admin.query(
		api.tables.products.queries.fetchAllProductsAdmin.fetchAllProductsAdmin,
		{
			paginationOpts: { numItems: 10, cursor: null }
		}
	);

	expect(created).toMatchObject({
		name: 'Canvas backpack',
		slug: 'canvas-backpack',
		images: [],
		imageKeys: [],
		trackInventory: true,
		inventory: 5,
		reservedInventory: 0
	});
	const createdFoundation = await t.run(async (ctx) => {
		const product = await ctx.db.get(created._id);
		return { product };
	});
	expect(createdFoundation.product).toMatchObject({
		trackInventory: true,
		status: 'draft'
	});
	expect(page.total).toBe(1);
	expect(page.items).toHaveLength(1);
	expect(page.items[0]?._id).toBe(created._id);
	expect(page.items[0]?.categoryOption.name).toBe(category.name);
	const searchQuery = api.tables.products.queries.fetchProductsSearch.fetchProductsSearch;
	await expect(user.query(searchQuery, { search: 'Canvas' })).rejects.toMatchObject({
		data: { code: 'FORBIDDEN' }
	});
	expect(
		(await admin.query(searchQuery, { search: 'Canvas' })).map((product) => product._id)
	).toEqual([created._id]);
	expect(await admin.query(searchQuery, { search: 'C' })).toEqual([]);
	const publicPage = await t.query(
		api.tables.products.queries.fetchAllProductsPublic.fetchAllProductsPublic,
		{
			paginationOpts: { numItems: 10, cursor: null }
		}
	);
	expect(publicPage).toMatchObject({ items: [], total: 0 });
	await t.run((ctx) => ctx.db.patch(created._id, { reservedInventory: 1 }));
	await expect(
		admin.mutation(api.tables.products.mutations.saveProduct.saveProduct, {
			id: created._id,
			name: created.name,
			description: created.description,
			priceInCents: created.priceInCents,
			trackInventory: false,
			inventory: 0,
			categoryId: category._id
		})
	).rejects.toMatchObject({
		data: { code: 'CANNOT_DISABLE_INVENTORY_WITH_RESERVATIONS' }
	});
	await expect(
		admin.mutation(api.tables.products.mutations.saveProduct.saveProduct, {
			id: created._id,
			name: created.name,
			description: created.description,
			priceInCents: created.priceInCents,
			trackInventory: true,
			inventory: 0,
			categoryId: category._id
		})
	).rejects.toMatchObject({ data: { code: 'STOCK_BELOW_RESERVED' } });
	await t.run((ctx) => ctx.db.patch(created._id, { reservedInventory: 0 }));

	const updated = await admin.mutation(api.tables.products.mutations.saveProduct.saveProduct, {
		id: created._id,
		name: 'Updated canvas backpack',
		description: created.description,
		priceInCents: created.priceInCents,
		trackInventory: false,
		inventory: created.inventory,
		categoryId: category._id,
		retainedFiles: []
	});
	expect(updated).toMatchObject({
		name: 'Updated canvas backpack',
		imageKeys: [],
		trackInventory: false
	});

	await expect(
		user.mutation(api.tables.products.mutations.deleteProduct.deleteProduct, { id: created._id })
	).rejects.toMatchObject({ data: { code: 'FORBIDDEN' } });

	await expect(
		admin.mutation(api.tables.products.mutations.deleteProduct.deleteProduct, { id: created._id })
	).resolves.toBeNull();

	await expect(
		admin.mutation(api.tables.products.mutations.deleteProduct.deleteProduct, { id: created._id })
	).rejects.toMatchObject({ data: { code: 'PRODUCT_NOT_FOUND' } });

	const emptyPage = await admin.query(
		api.tables.products.queries.fetchAllProductsPublic.fetchAllProductsPublic,
		{
			paginationOpts: { numItems: 10, cursor: null }
		}
	);
	expect(emptyPage.total).toBe(0);
});

test('rejects invalid product details without creating products or consuming uploads', async () => {
	const t = createTestContext();
	const admin = t.withIdentity({
		tokenIdentifier: 'invalid-admin',
		subject: 'invalid-admin',
		role: 'admin'
	});
	const category = await admin.mutation(
		api.tables.categories.mutations.createCategory.createCategory,
		{ name: 'Validation', status: 'active' }
	);
	const imageKey = 'products/retryable-upload';
	await t.run((ctx) =>
		ctx.db.insert('storageUploads', {
			ownerId: 'invalid-admin',
			key: imageKey,
			expectedSize: 1,
			expectedContentType: 'image/webp',
			status: 'uploaded',
			createdAt: Date.now()
		})
	);
	const input = {
		name: 'Invalid product',
		description: 'Must roll back',
		priceInCents: 100,
		trackInventory: true,
		inventory: 0,
		categoryId: category._id,
		uploadedFiles: [imageKey]
	};
	await expect(
		admin.mutation(api.tables.products.mutations.saveProduct.saveProduct, { ...input, name: ' ' })
	).rejects.toMatchObject({ data: { code: 'INVALID_PRODUCT_DATA' } });
	await t.run(async (ctx) => {
		expect(await ctx.db.query('products').take(1)).toEqual([]);
		expect(
			await ctx.db
				.query('storageUploads')
				.withIndex('by_key', (q) => q.eq('key', imageKey))
				.unique()
		).not.toBeNull();
	});
	const page = await admin.query(
		api.tables.products.queries.fetchAllProductsAdmin.fetchAllProductsAdmin,
		{ paginationOpts: { numItems: 10, cursor: null } }
	);
	expect(page.total).toBe(0);
	await admin.mutation(api.tables.products.mutations.saveProduct.saveProduct, {
		...input
	});
	expect(
		await t.run((ctx) =>
			ctx.db
				.query('storageUploads')
				.withIndex('by_key', (q) => q.eq('key', imageKey))
				.unique()
		)
	).toBeNull();
});

test('rejects duplicate slugs, unavailable categories, foreign uploads, and unauthorized creation', async () => {
	const t = createTestContext();
	const admin = t.withIdentity({
		tokenIdentifier: 'guard-admin',
		subject: 'guard-admin',
		role: 'admin'
	});
	const user = t.withIdentity({ tokenIdentifier: 'ordinary-user', subject: 'ordinary-user' });
	const category = await admin.mutation(
		api.tables.categories.mutations.createCategory.createCategory,
		{ name: 'Guards', status: 'active' }
	);
	const input = {
		name: 'Same name',
		description: 'Guarded product',
		priceInCents: 100,
		trackInventory: true,
		inventory: 0,
		categoryId: category._id
	};
	await expect(
		user.mutation(api.tables.products.mutations.saveProduct.saveProduct, input)
	).rejects.toMatchObject({ data: { code: 'FORBIDDEN' } });
	await admin.mutation(api.tables.products.mutations.saveProduct.saveProduct, input);
	await expect(
		admin.mutation(api.tables.products.mutations.saveProduct.saveProduct, {
			...input,
			name: 'Same-name'
		})
	).rejects.toMatchObject({ data: { code: 'PRODUCT_SLUG_TAKEN' } });
	await expect(
		admin.mutation(api.tables.products.mutations.saveProduct.saveProduct, {
			...input,
			name: '!!!'
		})
	).rejects.toMatchObject({ data: { code: 'INVALID_PRODUCT_DATA' } });
	await t.run((ctx) =>
		ctx.db.insert('storageUploads', {
			ownerId: 'guard-admin',
			key: 'categories/foreign',
			expectedSize: 1,
			expectedContentType: 'image/webp',
			status: 'uploaded',
			createdAt: Date.now()
		})
	);
	await expect(
		admin.mutation(api.tables.products.mutations.saveProduct.saveProduct, {
			...input,
			name: 'Wrong namespace',
			uploadedFiles: ['categories/foreign']
		})
	).rejects.toMatchObject({ data: { code: 'INVALID_UPLOAD_NAMESPACE' } });
	await admin.mutation(api.tables.categories.mutations.updateCategory.updateCategory, {
		id: category._id,
		name: category.name,
		status: 'archived'
	});
	await expect(
		admin.mutation(api.tables.products.mutations.saveProduct.saveProduct, {
			...input,
			name: 'Archived category',
			status: 'active'
		})
	).rejects.toMatchObject({ data: { code: 'INVALID_CATEGORY_DATA' } });
	await t.run(async (ctx) => {
		expect(await ctx.db.query('products').take(2)).toHaveLength(1);
	});
});
