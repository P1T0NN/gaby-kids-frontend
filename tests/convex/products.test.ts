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

// TYPES
import type { Id } from '../../src/convex/_generated/dataModel';

const modules = import.meta.glob('../../src/convex/**/*.ts');

function defaultProductVariant(priceInCents: number, inventory: number) {
	return { options: [], sku: '', imageKeys: [], priceInCents, inventory };
}

test('cart returns product variant names and identifies missing, malformed, wrong-table and unpublished IDs', async () => {
	const t = createTestContext();
	const ids = await t.run(async (ctx) => {
		const categoryId = await ctx.db.insert('categories', {
			name: 'Cart',
			slug: 'cart',
			status: 'active'
		});
		const products: Id<'products'>[] = [];
		const productVariants: Id<'productVariants'>[] = [];
		for (const status of ['active', 'active', 'draft', 'archived', 'active'] as const) {
			const productId = await ctx.db.insert('products', {
				name: `Product ${products.length}`,
				slug: `cart-${products.length}`,
				description: '',
				priceInCents: 100,
				categoryId,
				images: [],
				imageKeys: [],
				storagePrefix: 'products',
				trackInventory: true,
				productVariantOptionNames: ['Color'],
				hasPriceRange: false,
				upsellProductIds: [],
				status
			});
			products.push(productId);
			productVariants.push(
				await ctx.db.insert('productVariants', {
					productId,
					position: 0,
					options: [{ name: 'Color', value: `Color ${productVariants.length}` }],
					sku: `CART-${productVariants.length}`,
					imageKeys: [],
					priceInCents: 100,
					inventory: 0,
					reservedInventory: 0
				})
			);
		}
		await ctx.db.delete('products', products[4]);
		return { products, productVariants, categoryId };
	});
	const query = api.tables.productVariants.queries.fetchCart.fetchCart;
	const result = await t.query(query, {
		productVariantIds: [...ids.productVariants, 'invalid', ids.categoryId, ids.productVariants[0]]
	});
	expect(result.items).toEqual([
		{
			id: ids.productVariants[0],
			productId: ids.products[0],
			name: 'Product 0',
			productVariantLabel: 'Color 0',
			priceInCents: 100,
			trackInventory: true,
			inventory: 0,
			reservedInventory: 0
		},
		{
			id: ids.productVariants[1],
			productId: ids.products[1],
			name: 'Product 1',
			productVariantLabel: 'Color 1',
			priceInCents: 100,
			trackInventory: true,
			inventory: 0,
			reservedInventory: 0
		}
	]);
	expect(result.invalidIds).toEqual([...ids.productVariants.slice(2), 'invalid', ids.categoryId]);
	expect(await t.query(query, { productVariantIds: [] })).toEqual({ items: [], invalidIds: [] });
	await expect(t.query(query, { productVariantIds: Array(51).fill('invalid') })).rejects.toThrow();
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
				productVariantOptionNames: [],
				hasPriceRange: false,
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
					productVariantOptionNames: [],
					hasPriceRange: false,
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
				productVariantOptionNames: [],
				hasPriceRange: false,
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
				productVariantOptionNames: [],
				hasPriceRange: false,
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
			trackInventory: true,
			categoryId: category._id,
			productVariantOptionNames: [],
			productVariants: [defaultProductVariant(100, 0)]
		})
	).rejects.toMatchObject({ data: { code: 'FORBIDDEN' } });

	await expect(
		admin.mutation(api.tables.products.mutations.saveProduct.saveProduct, {
			name: '',
			description: 'A product name is required.',
			trackInventory: true,
			categoryId: category._id,
			productVariantOptionNames: [],
			productVariants: [defaultProductVariant(100, 0)]
		})
	).rejects.toMatchObject({ data: { code: 'INVALID_PRODUCT_DATA' } });

	const created = await admin.mutation(api.tables.products.mutations.saveProduct.saveProduct, {
		name: 'Canvas backpack',
		description: 'A durable everyday backpack.',
		trackInventory: true,
		categoryId: category._id,
		productVariantOptionNames: [],
		productVariants: [defaultProductVariant(100, 5)]
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
		productVariantOptionNames: [],
		hasPriceRange: false,
		trackInventory: true
	});
	const createdFoundation = await t.run(async (ctx) => {
		const product = await ctx.db.get(created._id);
		return { product };
	});
	expect(createdFoundation.product).toMatchObject({
		trackInventory: true,
		status: 'draft'
	});
	const createdProductVariant = await t.run(async (ctx) => {
		const productVariants = await ctx.db
			.query('productVariants')
			.withIndex('by_product_id', (query) => query.eq('productId', created._id))
			.collect();
		return productVariants[0]!;
	});
	expect(createdProductVariant).toMatchObject({
		position: 0,
		options: [],
		sku: 'canvas-backpack',
		imageKeys: [],
		priceInCents: 100,
		inventory: 5,
		reservedInventory: 0
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
	await t.run((ctx) => ctx.db.patch(createdProductVariant._id, { reservedInventory: 1 }));
	await expect(
		admin.mutation(api.tables.products.mutations.saveProduct.saveProduct, {
			id: created._id,
			name: created.name,
			description: created.description,
			trackInventory: false,
			categoryId: category._id,
			productVariantOptionNames: [],
			productVariants: [{ ...defaultProductVariant(100, 0), id: createdProductVariant._id }]
		})
	).rejects.toMatchObject({
		data: { code: 'CANNOT_DISABLE_INVENTORY_WITH_RESERVATIONS' }
	});
	await expect(
		admin.mutation(api.tables.products.mutations.saveProduct.saveProduct, {
			id: created._id,
			name: created.name,
			description: created.description,
			trackInventory: true,
			categoryId: category._id,
			productVariantOptionNames: [],
			productVariants: [{ ...defaultProductVariant(100, 0), id: createdProductVariant._id }]
		})
	).rejects.toMatchObject({ data: { code: 'PRODUCT_VARIANT_STOCK_BELOW_RESERVED' } });
	await t.run((ctx) => ctx.db.patch(createdProductVariant._id, { reservedInventory: 0 }));

	const updated = await admin.mutation(api.tables.products.mutations.saveProduct.saveProduct, {
		id: created._id,
		name: 'Updated canvas backpack',
		description: created.description,
		trackInventory: false,
		categoryId: category._id,
		productVariantOptionNames: [],
		productVariants: [
			{
				...defaultProductVariant(100, createdProductVariant.inventory),
				id: createdProductVariant._id
			}
		],
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
	// Variant cleanup runs in scheduled batches.
	await new Promise((resolve) => setTimeout(resolve, 0));
	await t.finishInProgressScheduledFunctions();
	expect(await t.run((ctx) => ctx.db.query('productVariants').collect())).toEqual([]);

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
		trackInventory: true,
		categoryId: category._id,
		productVariantOptionNames: [],
		productVariants: [defaultProductVariant(100, 0)],
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
		trackInventory: true,
		categoryId: category._id,
		productVariantOptionNames: [],
		productVariants: [defaultProductVariant(100, 0)]
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

test('saves structured product variants, derives display caches, and guards reserved product variant stock', async () => {
	const t = createTestContext();
	const admin = t.withIdentity({
		tokenIdentifier: 'product-variant-admin',
		subject: 'product-variant-admin',
		role: 'admin'
	});
	const category = await admin.mutation(
		api.tables.categories.mutations.createCategory.createCategory,
		{ name: 'Variants', status: 'active' }
	);
	const saveProduct = api.tables.products.mutations.saveProduct.saveProduct;

	const created = await admin.mutation(saveProduct, {
		name: 'Variant shirt',
		description: 'Two colors',
		trackInventory: true,
		categoryId: category._id,
		productVariantOptionNames: ['Color'],
		productVariants: [
			{
				options: [{ name: 'Color', value: 'Red' }],
				sku: 'SHIRT-RED',
				imageKeys: [],
				priceInCents: 2000,
				inventory: 2
			},
			{
				options: [{ name: 'Color', value: 'Blue' }],
				sku: '',
				imageKeys: [],
				priceInCents: 2500,
				compareAtPriceInCents: 3000,
				inventory: 1
			}
		]
	});

	expect(created).toMatchObject({
		productVariantOptionNames: ['Color'],
		priceInCents: 2000,
		hasPriceRange: true
	});
	expect(created.compareAtPriceInCents).toBeUndefined();

	const productVariants = await t.run((ctx) =>
		ctx.db
			.query('productVariants')
			.withIndex('by_product_id', (query) => query.eq('productId', created._id))
			.collect()
	);
	expect(
		productVariants.map((productVariant) => ({
			position: productVariant.position,
			sku: productVariant.sku,
			price: productVariant.priceInCents,
			compareAt: productVariant.compareAtPriceInCents
		}))
	).toEqual([
		{ position: 0, sku: 'SHIRT-RED', price: 2000, compareAt: undefined },
		{ position: 1, sku: 'variant-shirt-blue', price: 2500, compareAt: 3000 }
	]);

	await expect(
		admin.mutation(saveProduct, {
			id: created._id,
			name: created.name,
			description: created.description,
			trackInventory: true,
			categoryId: category._id,
			productVariantOptionNames: ['Color'],
			productVariants: [
				{
					options: [{ name: 'Color', value: 'Red' }],
					sku: 'DUP-SKU',
					imageKeys: [],
					priceInCents: 2000,
					inventory: 2
				},
				{
					options: [{ name: 'Color', value: 'Blue' }],
					sku: 'DUP-SKU',
					imageKeys: [],
					priceInCents: 2500,
					inventory: 1
				}
			]
		})
	).rejects.toMatchObject({ data: { code: 'PRODUCT_VARIANT_SKU_TAKEN' } });

	await expect(
		admin.mutation(saveProduct, {
			id: created._id,
			name: created.name,
			description: created.description,
			trackInventory: true,
			categoryId: category._id,
			productVariantOptionNames: ['Color'],
			productVariants: [
				{
					options: [{ name: 'Color', value: 'Red' }],
					sku: 'SHIRT-RED',
					imageKeys: [],
					priceInCents: 2000,
					inventory: 2
				},
				{
					options: [{ name: 'Color', value: 'Red' }],
					sku: 'SHIRT-RED-2',
					imageKeys: [],
					priceInCents: 2100,
					inventory: 1
				}
			]
		})
	).rejects.toMatchObject({ data: { code: 'INVALID_PRODUCT_DATA' } });

	await expect(
		admin.mutation(saveProduct, {
			id: created._id,
			name: created.name,
			description: created.description,
			trackInventory: true,
			categoryId: category._id,
			productVariantOptionNames: ['Color'],
			productVariants: [
				{
					options: [{ name: 'Color', value: 'Red' }],
					sku: 'SHIRT-RED',
					imageKeys: ['products/foreign-image'],
					priceInCents: 2000,
					inventory: 2
				}
			]
		})
	).rejects.toMatchObject({ data: { code: 'INVALID_PRODUCT_VARIANT_IMAGE' } });

	const updated = await admin.mutation(saveProduct, {
		id: created._id,
		name: created.name,
		description: created.description,
		trackInventory: true,
		categoryId: category._id,
		productVariantOptionNames: ['Color'],
		productVariants: [
			{
				id: productVariants[0]!._id,
				options: [{ name: 'Color', value: 'Red' }],
				sku: 'SHIRT-RED',
				imageKeys: [],
				priceInCents: 2000,
				inventory: 2
			},
			{
				id: productVariants[1]!._id,
				options: [{ name: 'Color', value: 'Blue' }],
				sku: productVariants[1]!.sku,
				imageKeys: [],
				priceInCents: 2500,
				inventory: 1
			}
		]
	});
	expect(updated.compareAtPriceInCents).toBeUndefined();
	const storedBlue = await t.run((ctx) => ctx.db.get(productVariants[1]!._id));
	expect(storedBlue).not.toHaveProperty('compareAtPriceInCents');

	const detail = await admin.query(api.tables.products.queries.fetchProductById.fetchProductById, {
		id: created._id
	});
	expect(detail.productVariantOptionNames).toEqual(['Color']);
	expect(
		detail.productVariants.map((productVariant) => ({
			position: productVariant.position,
			sku: productVariant.sku
		}))
	).toEqual([
		{ position: 0, sku: 'SHIRT-RED' },
		{ position: 1, sku: 'variant-shirt-blue' }
	]);

	await t.run((ctx) => ctx.db.patch(productVariants[0]!._id, { reservedInventory: 1 }));
	await expect(
		admin.mutation(saveProduct, {
			id: created._id,
			name: created.name,
			description: created.description,
			trackInventory: true,
			categoryId: category._id,
			productVariantOptionNames: ['Color'],
			productVariants: [
				{
					id: productVariants[1]!._id,
					options: [{ name: 'Color', value: 'Blue' }],
					sku: productVariants[1]!.sku,
					imageKeys: [],
					priceInCents: 2500,
					inventory: 1
				}
			]
		})
	).rejects.toMatchObject({ data: { code: 'CANNOT_DELETE_RESERVED_PRODUCT_VARIANT' } });
	await t.run((ctx) => ctx.db.patch(productVariants[0]!._id, { reservedInventory: 0 }));

	const other = await admin.mutation(saveProduct, {
		name: 'Plain mug',
		description: 'No options',
		trackInventory: true,
		categoryId: category._id,
		productVariantOptionNames: [],
		productVariants: [defaultProductVariant(100, 0)]
	});
	await expect(
		admin.mutation(saveProduct, {
			id: other._id,
			name: other.name,
			description: other.description,
			trackInventory: true,
			categoryId: category._id,
			productVariantOptionNames: ['Color'],
			productVariants: [
				{
					id: productVariants[0]!._id,
					options: [{ name: 'Color', value: 'Red' }],
					sku: 'SHIRT-RED',
					imageKeys: [],
					priceInCents: 2000,
					inventory: 2
				}
			]
		})
	).rejects.toMatchObject({ data: { code: 'INVALID_PRODUCT_VARIANT' } });

	await admin.mutation(api.tables.products.mutations.deleteProduct.deleteProduct, {
		id: created._id
	});
	// Variant cleanup runs in scheduled batches.
	await new Promise((resolve) => setTimeout(resolve, 0));
	await t.finishInProgressScheduledFunctions();
	expect(
		await t.run((ctx) =>
			ctx.db
				.query('productVariants')
				.withIndex('by_product_id', (query) => query.eq('productId', created._id))
				.collect()
		)
	).toEqual([]);
});
