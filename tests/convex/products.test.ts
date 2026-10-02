/// <reference types="vite/client" />

import aggregateTest from '@convex-dev/aggregate/test';
import actionRetrierTest from '@convex-dev/action-retrier/test';
import rateLimiterTest from '@convex-dev/rate-limiter/test';
import r2Test from '@convex-dev/r2/test';
import migrationsTest from '@convex-dev/migrations/test';
import { runToCompletion } from '@convex-dev/migrations';
import auditLogTest from 'convex-audit-log/test';
import { convexTest } from 'convex-test';
import type { FunctionReturnType } from 'convex/server';
import { expect, test, vi } from 'vitest';

import { api, components, internal } from '../../src/convex/_generated/api';
import schema from '../../src/convex/schema';
import { createProductOptionIndex } from '../../src/convex/tables/productOptionIndex/helpers/createProductOptionIndex.js';

// TYPES
import type { Id } from '../../src/convex/_generated/dataModel';

const modules = import.meta.glob('../../src/convex/**/*.ts');

const PRODUCT_IMAGE_KEY = 'products/test-image';

function defaultProductVariant(priceInCents: number, inventory: number) {
	return { options: [], sku: '', imageKeys: [PRODUCT_IMAGE_KEY], priceInCents, inventory };
}

async function insertProductImageUpload(
	t: ReturnType<typeof createTestContext>,
	ownerId: string
): Promise<void> {
	await t.run((ctx) =>
		ctx.db.insert('storageUploads', {
			ownerId,
			key: PRODUCT_IMAGE_KEY,
			expectedSize: 1,
			expectedContentType: 'image/webp',
			status: 'uploaded',
			createdAt: Date.now()
		})
	);
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

test('shop sorts products newest or oldest without exposing unpublished products', async () => {
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
				imageKeys: [],
				storagePrefix: 'products',
				trackInventory: true,
				productVariantOptionNames: [],
				hasPriceRange: false,
				upsellProductIds: [],
				status: 'active'
			})
		);
		for (const [name, daysAgo, status] of [
			['Canvas active', 3, 'active'],
			['Canvas cleared', 2, 'active'],
			['Canvas plain', 1, 'active'],
			['Canvas draft', 0, 'draft'],
			['Canvas archived', 0, 'archived']
		] as const) {
			vi.setSystemTime(asOf - daysAgo * 24 * 60 * 60 * 1000);
			await t.run((ctx) =>
				ctx.db.insert('products', {
					name,
					slug: name.toLowerCase().replace(' ', '-'),
					description: name,
					priceInCents: 100,
					categoryId,
					imageKeys: [],
					storagePrefix: 'products',
					trackInventory: true,
					productVariantOptionNames: [],
					hasPriceRange: false,
					upsellProductIds: [],
					status
				})
			);
		}
		const query = api.tables.products.queries.fetchAllProductsPublic.fetchAllProductsPublic;
		const newest = await t.query(query, {
			paginationOpts: { cursor: null, numItems: 12 }
		});
		expect(newest.items.map((product) => product.name)).toEqual([
			'Canvas plain',
			'Canvas cleared',
			'Canvas active',
			'Canvas old'
		]);
		const oldest = await t.query(query, {
			paginationOpts: { cursor: null, numItems: 12 },
			filters: { sort: 'asc' }
		});
		expect(oldest.items.map((product) => product.name)).toEqual([
			'Canvas old',
			'Canvas active',
			'Canvas cleared',
			'Canvas plain'
		]);
		const names: string[] = [];
		let cursor: string | null = null;
		for (let page = 0; page < 10; page++) {
			const result: FunctionReturnType<typeof query> = await t.query(query, {
				paginationOpts: { cursor, numItems: 2 },
				search: 'Canvas'
			});
			names.push(...result.items.map((product) => product.name));
			cursor = result.nextCursor;
			if (!cursor) break;
		}
		expect(cursor).toBeNull();
		expect(names.sort()).toEqual(['Canvas active', 'Canvas cleared', 'Canvas old', 'Canvas plain']);
	} finally {
		vi.useRealTimers();
	}
});

test('filters storefront products by age group and gender, alone and with a category', async () => {
	const t = createTestContext();
	const categoryId = await t.run((ctx) =>
		ctx.db.insert('categories', { name: 'Kids shoes', slug: 'kids-shoes', status: 'active' })
	);
	const otherCategoryId = await t.run((ctx) =>
		ctx.db.insert('categories', { name: 'Accessories', slug: 'accessories', status: 'active' })
	);

	async function insertProduct(
		name: string,
		attributes: { ageGroup?: 'kids' | 'adults'; gender?: 'unisex' | 'male' | 'female' },
		category: Id<'categories'>
	): Promise<void> {
		await t.run(async (ctx) => {
			const product = {
				name,
				slug: name.toLowerCase().replaceAll(' ', '-'),
				description: name,
				priceInCents: 100,
				categoryId: category,
				imageKeys: [],
				storagePrefix: 'products',
				trackInventory: true,
				productVariantOptionNames: [],
				hasPriceRange: false,
				upsellProductIds: [],
				status: 'active' as const
			};
			if (attributes.ageGroup !== undefined) {
				Object.assign(product, { ageGroup: attributes.ageGroup });
			}
			if (attributes.gender !== undefined) Object.assign(product, { gender: attributes.gender });
			const productId = await ctx.db.insert('products', product);
			await createProductOptionIndex({
				ctx,
				product: (await ctx.db.get(productId))!,
				variants: []
			});
		});
	}

	await insertProduct('Girls runner', { ageGroup: 'kids', gender: 'female' }, categoryId);
	await insertProduct('Boys runner', { ageGroup: 'kids', gender: 'male' }, categoryId);
	await insertProduct('Adults runner', { ageGroup: 'adults', gender: 'unisex' }, categoryId);
	await insertProduct('Unisex hat', { ageGroup: 'adults', gender: 'unisex' }, otherCategoryId);
	await insertProduct('Legacy sandal', {}, categoryId);

	const query = api.tables.products.queries.fetchAllProductsPublic.fetchAllProductsPublic;
	const kids = await t.query(query, {
		paginationOpts: { cursor: null, numItems: 12 },
		filters: { ageGroup: 'kids' }
	});
	expect(kids.items.map((product) => product.name).sort()).toEqual(['Boys runner', 'Girls runner']);

	const female = await t.query(query, {
		paginationOpts: { cursor: null, numItems: 12 },
		filters: { gender: 'female' }
	});
	expect(female.items.map((product) => product.name)).toEqual(['Girls runner']);

	const kidsFemale = await t.query(query, {
		paginationOpts: { cursor: null, numItems: 12 },
		filters: { ageGroup: 'kids', gender: 'female' }
	});
	expect(kidsFemale.items.map((product) => product.name)).toEqual(['Girls runner']);

	const categoryOnly = await t.query(query, {
		paginationOpts: { cursor: null, numItems: 12 },
		filters: { category: 'kids-shoes' }
	});
	expect(categoryOnly.items.map((product) => product.name).sort()).toEqual([
		'Adults runner',
		'Boys runner',
		'Girls runner',
		'Legacy sandal'
	]);

	const categoryAndAgeGroup = await t.query(query, {
		paginationOpts: { cursor: null, numItems: 12 },
		filters: { category: 'kids-shoes', ageGroup: 'kids' }
	});
	expect(categoryAndAgeGroup.items.map((product) => product.name).sort()).toEqual([
		'Boys runner',
		'Girls runner'
	]);

	const unisex = await t.query(query, {
		paginationOpts: { cursor: null, numItems: 12 },
		filters: { gender: 'unisex' }
	});
	expect(unisex.items.map((product) => product.name).sort()).toEqual([
		'Adults runner',
		'Unisex hat'
	]);
});

test.each([undefined, 'Attribute'])(
	'paginates storefront attribute filters with search %s',
	async (search) => {
		const t = createTestContext();
		const categoryId = await t.run((ctx) =>
			ctx.db.insert('categories', {
				name: 'Paginated attributes',
				slug: 'paginated-attributes',
				status: 'active'
			})
		);

		for (let i = 0; i < 26; i++) {
			await t.run(async (ctx) => {
				const id = await ctx.db.insert('products', {
					name: `Attribute product ${i}`,
					slug: `attribute-product-${i}`,
					description: '',
					priceInCents: 100,
					categoryId,
					ageGroup: i < 14 ? 'kids' : 'adults',
					gender: i % 2 === 0 ? 'female' : 'unisex',
					imageKeys: [],
					storagePrefix: 'products',
					trackInventory: true,
					productVariantOptionNames: [],
					hasPriceRange: false,
					upsellProductIds: [],
					status: 'active'
				});
				await createProductOptionIndex({ ctx, product: (await ctx.db.get(id))!, variants: [] });
			});
		}

		const query = api.tables.products.queries.fetchAllProductsPublic.fetchAllProductsPublic;

		// 14 products match the combined filter, so the first page must fill exactly
		// 12 items and the second page must hold the remaining 2 without gaps.
		const kidsPageOne = await t.query(query, {
			paginationOpts: { cursor: null, numItems: 12 },
			search,
			filters: { category: 'paginated-attributes', ageGroup: 'kids' }
		});
		expect(kidsPageOne.items).toHaveLength(12);
		expect(kidsPageOne.hasNextPage).toBe(true);

		const kidsPageTwo = await t.query(query, {
			paginationOpts: { cursor: kidsPageOne.nextCursor, numItems: 12 },
			search,
			filters: { category: 'paginated-attributes', ageGroup: 'kids' }
		});
		expect(kidsPageTwo.items).toHaveLength(2);
		expect(kidsPageTwo.hasNextPage).toBe(false);

		const kidIds = new Set(
			[...kidsPageOne.items, ...kidsPageTwo.items].map((product) => product._id)
		);
		expect(kidIds.size).toBe(14);

		// All three attributes must apply before pagination.
		const kidsFemale = await t.query(query, {
			paginationOpts: { cursor: null, numItems: 12 },
			search,
			filters: { category: 'paginated-attributes', ageGroup: 'kids', gender: 'female' }
		});
		expect(kidsFemale.items).toHaveLength(7);
		expect(kidsFemale.hasNextPage).toBe(false);
		expect(kidsFemale.items.every((product) => product.ageGroup === 'kids')).toBe(true);

		// Search combined with an attribute filter still paginates through the search index.
		const searched = await t.query(query, {
			paginationOpts: { cursor: null, numItems: 12 },
			search: 'Attribute product',
			filters: { category: 'paginated-attributes' }
		});
		expect(searched.items).toHaveLength(12);
		expect(searched.hasNextPage).toBe(true);
	}
);

test('saving a product without attributes defaults to kids and unisex', async () => {
	const t = createTestContext();
	const admin = t.withIdentity({
		tokenIdentifier: 'attributes-admin',
		subject: 'attributes-admin',
		role: 'admin'
	});
	const category = await admin.mutation(
		api.tables.categories.mutations.createCategory.createCategory,
		{ name: 'Default attributes', status: 'active' }
	);
	await insertProductImageUpload(t, 'attributes-admin');

	const created = await admin.mutation(api.tables.products.mutations.saveProduct.saveProduct, {
		name: 'Defaults to adults unisex',
		description: 'No attributes sent.',
		trackInventory: true,
		categoryIds: [category._id],
		productVariantOptionNames: [],
		productVariants: [defaultProductVariant(200, 1)],
		uploadedFiles: [PRODUCT_IMAGE_KEY]
	});

	expect(created.ageGroup).toBe('kids');
	expect(created.gender).toBe('unisex');
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
			categoryIds: [category._id],
			productVariantOptionNames: [],
			productVariants: [defaultProductVariant(100, 0)]
		})
	).rejects.toMatchObject({ data: { code: 'FORBIDDEN' } });

	await expect(
		admin.mutation(api.tables.products.mutations.saveProduct.saveProduct, {
			name: '',
			description: 'A product name is required.',
			trackInventory: true,
			categoryIds: [category._id],
			productVariantOptionNames: [],
			productVariants: [defaultProductVariant(100, 0)]
		})
	).rejects.toMatchObject({ data: { code: 'INVALID_PRODUCT_DATA' } });

	await insertProductImageUpload(t, 'product-admin');
	const created = await admin.mutation(api.tables.products.mutations.saveProduct.saveProduct, {
		name: 'Canvas backpack',
		description: 'A durable everyday backpack.',
		trackInventory: true,
		categoryIds: [category._id],
		productVariantOptionNames: [],
		productVariants: [defaultProductVariant(100, 5)],
		uploadedFiles: [PRODUCT_IMAGE_KEY]
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
		images: [`https://cdn.example.com/${PRODUCT_IMAGE_KEY}`],
		imageKeys: [PRODUCT_IMAGE_KEY],
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
		sku: 'CAN-BAC',
		imageKeys: [PRODUCT_IMAGE_KEY],
		priceInCents: 100,
		inventory: 5,
		reservedInventory: 0
	});
	expect(page.total).toBe(1);
	expect(page.items).toHaveLength(1);
	expect(page.items[0]?._id).toBe(created._id);
	expect(page.items[0]?.categoryOptions[0]?.name).toBe(category.name);
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
			categoryIds: [category._id],
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
			categoryIds: [category._id],
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
		categoryIds: [category._id],
		productVariantOptionNames: [],
		productVariants: [
			{
				...defaultProductVariant(100, createdProductVariant.inventory),
				id: createdProductVariant._id
			}
		]
	});
	expect(updated).toMatchObject({
		name: 'Updated canvas backpack',
		imageKeys: [PRODUCT_IMAGE_KEY],
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
		categoryIds: [category._id],
		productVariantOptionNames: [],
		productVariants: [{ ...defaultProductVariant(100, 0), imageKeys: [imageKey] }],
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
		categoryIds: [category._id],
		productVariantOptionNames: [],
		productVariants: [defaultProductVariant(100, 0)]
	};
	await expect(
		user.mutation(api.tables.products.mutations.saveProduct.saveProduct, input)
	).rejects.toMatchObject({ data: { code: 'FORBIDDEN' } });
	await insertProductImageUpload(t, 'guard-admin');
	await admin.mutation(api.tables.products.mutations.saveProduct.saveProduct, {
		...input,
		uploadedFiles: [PRODUCT_IMAGE_KEY]
	});
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

	await insertProductImageUpload(t, 'product-variant-admin');
	const created = await admin.mutation(saveProduct, {
		name: 'Variant shirt',
		description: 'Two colors',
		trackInventory: true,
		categoryIds: [category._id],
		productVariantOptionNames: ['Color'],
		productVariants: [
			{
				options: [{ name: 'Color', value: 'Red' }],
				sku: 'SHIRT-RED',
				imageKeys: [PRODUCT_IMAGE_KEY],
				priceInCents: 2000,
				inventory: 2
			},
			{
				options: [{ name: 'Color', value: 'Blue' }],
				sku: '',
				imageKeys: [PRODUCT_IMAGE_KEY],
				priceInCents: 2500,
				compareAtPriceInCents: 3000,
				inventory: 1
			}
		],
		uploadedFiles: [PRODUCT_IMAGE_KEY]
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
		{ position: 1, sku: 'VAR-SHI-BLU', price: 2500, compareAt: 3000 }
	]);

	await expect(
		admin.mutation(saveProduct, {
			id: created._id,
			name: created.name,
			description: created.description,
			trackInventory: true,
			categoryIds: [category._id],
			productVariantOptionNames: ['Color'],
			productVariants: [
				{
					options: [{ name: 'Color', value: 'Red' }],
					sku: 'DUP-SKU',
					imageKeys: [PRODUCT_IMAGE_KEY],
					priceInCents: 2000,
					inventory: 2
				},
				{
					options: [{ name: 'Color', value: 'Blue' }],
					sku: 'DUP-SKU',
					imageKeys: [PRODUCT_IMAGE_KEY],
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
			categoryIds: [category._id],
			productVariantOptionNames: ['Color'],
			productVariants: [
				{
					options: [{ name: 'Color', value: 'Red' }],
					sku: 'SHIRT-RED',
					imageKeys: [PRODUCT_IMAGE_KEY],
					priceInCents: 2000,
					inventory: 2
				},
				{
					options: [{ name: 'Color', value: 'Red' }],
					sku: 'SHIRT-RED-2',
					imageKeys: [PRODUCT_IMAGE_KEY],
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
			categoryIds: [category._id],
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
		categoryIds: [category._id],
		productVariantOptionNames: ['Color'],
		productVariants: [
			{
				id: productVariants[0]!._id,
				options: [{ name: 'Color', value: 'Red' }],
				sku: 'SHIRT-RED',
				imageKeys: [PRODUCT_IMAGE_KEY],
				priceInCents: 2000,
				inventory: 2
			},
			{
				id: productVariants[1]!._id,
				options: [{ name: 'Color', value: 'Blue' }],
				sku: productVariants[1]!.sku,
				imageKeys: [PRODUCT_IMAGE_KEY],
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
		{ position: 1, sku: 'VAR-SHI-BLU' }
	]);

	await t.run((ctx) => ctx.db.patch(productVariants[0]!._id, { reservedInventory: 1 }));
	await expect(
		admin.mutation(saveProduct, {
			id: created._id,
			name: created.name,
			description: created.description,
			trackInventory: true,
			categoryIds: [category._id],
			productVariantOptionNames: ['Color'],
			productVariants: [
				{
					id: productVariants[1]!._id,
					options: [{ name: 'Color', value: 'Blue' }],
					sku: productVariants[1]!.sku,
					imageKeys: [PRODUCT_IMAGE_KEY],
					priceInCents: 2500,
					inventory: 1
				}
			]
		})
	).rejects.toMatchObject({ data: { code: 'CANNOT_DELETE_RESERVED_PRODUCT_VARIANT' } });
	await t.run((ctx) => ctx.db.patch(productVariants[0]!._id, { reservedInventory: 0 }));

	await insertProductImageUpload(t, 'product-variant-admin');
	const other = await admin.mutation(saveProduct, {
		name: 'Plain mug',
		description: 'No options',
		trackInventory: true,
		categoryIds: [category._id],
		productVariantOptionNames: [],
		productVariants: [defaultProductVariant(100, 0)],
		uploadedFiles: [PRODUCT_IMAGE_KEY]
	});
	await expect(
		admin.mutation(saveProduct, {
			id: other._id,
			name: other.name,
			description: other.description,
			trackInventory: true,
			categoryIds: [category._id],
			productVariantOptionNames: ['Color'],
			productVariants: [
				{
					id: productVariants[0]!._id,
					options: [{ name: 'Color', value: 'Red' }],
					sku: 'SHIRT-RED',
					imageKeys: [PRODUCT_IMAGE_KEY],
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

type ProductOptionSaveInput = {
	name: string;
	categoryId: Id<'categories'>;
	variants: { options: { name: string; value: string }[] }[];
	status?: 'draft' | 'active' | 'archived';
	ageGroup?: 'kids' | 'adults';
	gender?: 'unisex' | 'male' | 'female';
};

async function saveOptionProduct(
	t: ReturnType<typeof createTestContext>,
	ownerId: string,
	input: ProductOptionSaveInput
): Promise<Id<'products'>> {
	const admin = t.withIdentity({ tokenIdentifier: ownerId, subject: ownerId, role: 'admin' });
	await insertProductImageUpload(t, ownerId);

	const created = await admin.mutation(api.tables.products.mutations.saveProduct.saveProduct, {
		name: input.name,
		description: input.name,
		trackInventory: true,
		categoryIds: [input.categoryId],
		ageGroup: input.ageGroup ?? 'adults',
		gender: input.gender ?? 'unisex',
		productVariantOptionNames: input.variants[0]?.options.map((option) => option.name) ?? [],
		productVariants: input.variants.map((variant) => ({
			options: variant.options,
			sku: '',
			imageKeys: [PRODUCT_IMAGE_KEY],
			priceInCents: 100,
			inventory: 5
		})),
		uploadedFiles: [PRODUCT_IMAGE_KEY],
		status: input.status ?? 'active'
	});

	return created._id;
}

test('keeps product option search names and variant selections current on save', async () => {
	const t = createTestContext();
	const ownerId = 'product-option-admin';
	const admin = t.withIdentity({ tokenIdentifier: ownerId, subject: ownerId, role: 'admin' });
	const category = await admin.mutation(
		api.tables.categories.mutations.createCategory.createCategory,
		{ name: 'Option filters', status: 'active' }
	);
	const productId = await saveOptionProduct(t, ownerId, {
		name: 'Two color option shirt',
		categoryId: category._id,
		variants: [
			{
				options: [
					{ name: 'Color', value: 'Rojo' },
					{ name: 'Tallas', value: '5' }
				]
			},
			{
				options: [
					{ name: 'Color', value: 'Rojo' },
					{ name: 'Tallas', value: '3' }
				]
			},
			{
				options: [
					{ name: 'Color', value: 'ROJO' },
					{ name: 'Tallas', value: '4' }
				]
			}
		]
	});

	const product = await t.run((ctx) => ctx.db.get(productId));

	const indexRows = await t.run((ctx) =>
		ctx.db
			.query('productOptionIndex')
			.withIndex('by_product_id', (query) => query.eq('productId', productId))
			.collect()
	);
	expect(
		indexRows
			.filter((row) => row.categoryId === category._id && row.optionKey)
			.map((row) => row.optionKey)
			.sort()
	).toEqual([
		'color:rojo',
		'color:rojo|tallas:3',
		'color:rojo|tallas:4',
		'color:rojo|tallas:5',
		'tallas:3',
		'tallas:4',
		'tallas:5'
	]);
	expect(
		indexRows.every(
			(row) =>
				row.status === 'active' && (row.categoryId === category._id || row.categoryId === undefined)
		)
	).toBe(true);
	expect(indexRows.every((row) => row.productCreatedAt === product?._creationTime)).toBe(true);
	expect(indexRows.every((row) => row.name === product?.name)).toBe(true);

	// Saving only Rojo/5 drops the removed index rows.
	await admin.mutation(api.tables.products.mutations.saveProduct.saveProduct, {
		id: productId,
		name: 'Renamed boots',
		description: 'Two color option shirt',
		trackInventory: true,
		categoryIds: [category._id],
		gender: 'unisex',
		productVariantOptionNames: ['Color', 'Tallas'],
		productVariants: [
			{
				options: [
					{ name: 'Color', value: 'Rojo' },
					{ name: 'Tallas', value: '5' }
				],
				sku: '',
				imageKeys: [PRODUCT_IMAGE_KEY],
				priceInCents: 100,
				inventory: 5
			}
		],
		status: 'active'
	});

	const updatedRows = await t.run((ctx) =>
		ctx.db
			.query('productOptionIndex')
			.withIndex('by_product_id', (query) => query.eq('productId', productId))
			.collect()
	);
	expect(
		updatedRows
			.filter((row) => row.categoryId === category._id && row.optionKey)
			.map((row) => row.optionKey)
			.sort()
	).toEqual(['color:rojo', 'color:rojo|tallas:5', 'tallas:5']);
	expect(updatedRows.every((row) => row.name === 'Renamed boots')).toBe(true);
	const query = api.tables.products.queries.fetchAllProductsPublic.fetchAllProductsPublic;
	const renamed = await t.query(query, {
		paginationOpts: { cursor: null, numItems: 12 },
		search: 'boots',
		filters: { color: 'rojo', age: '5' }
	});
	expect(renamed.items.map((item) => item._id)).toEqual([productId]);
	const oldName = await t.query(query, {
		paginationOpts: { cursor: null, numItems: 12 },
		search: 'shirt',
		filters: { color: 'rojo' }
	});
	expect(oldName.items).toEqual([]);
});

test('filters storefront products by selected option values with category and attribute conjunction', async () => {
	const t = createTestContext();
	const ownerId = 'option-query-admin';
	const admin = t.withIdentity({ tokenIdentifier: ownerId, subject: ownerId, role: 'admin' });
	const women = await admin.mutation(
		api.tables.categories.mutations.createCategory.createCategory,
		{
			name: 'Women',
			status: 'active'
		}
	);
	const men = await admin.mutation(api.tables.categories.mutations.createCategory.createCategory, {
		name: 'Men',
		status: 'active'
	});

	await saveOptionProduct(t, ownerId, {
		name: 'Red large women shirt',
		categoryId: women._id,
		gender: 'female',
		variants: [
			{
				options: [
					{ name: 'Color', value: 'Rojo' },
					{ name: 'Tallas', value: '5' }
				]
			}
		]
	});
	await saveOptionProduct(t, ownerId, {
		name: 'Red small women shirt',
		categoryId: women._id,
		gender: 'female',
		variants: [
			{
				options: [
					{ name: 'Color', value: 'Rojo' },
					{ name: 'Tallas', value: '3' }
				]
			}
		]
	});
	await saveOptionProduct(t, ownerId, {
		name: 'Blue medium women shirt',
		categoryId: women._id,
		gender: 'female',
		variants: [
			{
				options: [
					{ name: 'Color', value: 'Azul' },
					{ name: 'Tallas', value: '4' }
				]
			}
		]
	});
	await saveOptionProduct(t, ownerId, {
		name: 'Red large men shirt',
		categoryId: men._id,
		gender: 'male',
		variants: [
			{
				options: [
					{ name: 'Color', value: 'Rojo' },
					{ name: 'Tallas', value: '5' }
				]
			}
		]
	});
	await saveOptionProduct(t, ownerId, {
		name: 'Red large girls shirt',
		categoryId: women._id,
		gender: 'female',
		ageGroup: 'kids',
		variants: [
			{
				options: [
					{ name: 'Color', value: 'Rojo' },
					{ name: 'Tallas', value: '5' }
				]
			}
		]
	});

	const query = api.tables.products.queries.fetchAllProductsPublic.fetchAllProductsPublic;
	const namesOf = (items: { name: string }[]) => items.map((product) => product.name).sort();

	const red = await t.query(query, {
		paginationOpts: { cursor: null, numItems: 12 },
		filters: { color: 'rojo' }
	});
	expect(namesOf(red.items)).toEqual([
		'Red large girls shirt',
		'Red large men shirt',
		'Red large women shirt',
		'Red small women shirt'
	]);
	expect(red.total).toBeUndefined();

	const redLarge = await t.query(query, {
		paginationOpts: { cursor: null, numItems: 12 },
		filters: { color: 'rojo', age: '5' }
	});
	expect(namesOf(redLarge.items)).toEqual([
		'Red large girls shirt',
		'Red large men shirt',
		'Red large women shirt'
	]);

	const redSmall = await t.query(query, {
		paginationOpts: { cursor: null, numItems: 12 },
		filters: { color: 'rojo', age: '3' }
	});
	expect(namesOf(redSmall.items)).toEqual(['Red small women shirt']);

	const redMedium = await t.query(query, {
		paginationOpts: { cursor: null, numItems: 12 },
		filters: { color: 'rojo', age: '4' }
	});
	expect(redMedium.items).toEqual([]);

	const womenRed = await t.query(query, {
		paginationOpts: { cursor: null, numItems: 12 },
		filters: { category: 'women', color: 'rojo' }
	});
	expect(namesOf(womenRed.items)).toEqual([
		'Red large girls shirt',
		'Red large women shirt',
		'Red small women shirt'
	]);

	const femaleRed = await t.query(query, {
		paginationOpts: { cursor: null, numItems: 12 },
		filters: { color: 'rojo', gender: 'female' }
	});
	expect(namesOf(femaleRed.items)).toEqual([
		'Red large girls shirt',
		'Red large women shirt',
		'Red small women shirt'
	]);

	const kidsRed = await t.query(query, {
		paginationOpts: { cursor: null, numItems: 12 },
		filters: { color: 'rojo', ageGroup: 'kids' }
	});
	expect(namesOf(kidsRed.items)).toEqual(['Red large girls shirt']);

	const unfiltered = await t.query(query, {
		paginationOpts: { cursor: null, numItems: 12 }
	});
	expect(unfiltered.total).toBe(5);
});

test.each([undefined, 'Boots'])(
	'paginates option filters with search %s without gaps',
	async (search) => {
		const t = createTestContext();
		const ownerId = 'option-pagination-admin';
		const admin = t.withIdentity({ tokenIdentifier: ownerId, subject: ownerId, role: 'admin' });
		const category = await admin.mutation(
			api.tables.categories.mutations.createCategory.createCategory,
			{ name: 'Option pagination', status: 'active' }
		);

		const expectedIds: Id<'products'>[] = [];
		for (let index = 0; index < 25; index += 1) {
			expectedIds.push(
				await saveOptionProduct(t, `${ownerId}-${index}`, {
					name: `Boots pagination product ${index}`,
					categoryId: category._id,
					variants: ['5', '3'].map((size) => ({
						options: [
							{ name: 'Color', value: 'Rojo' },
							{ name: 'Tallas', value: size }
						]
					}))
				})
			);
		}
		for (const status of ['active', 'draft', 'archived'] as const) {
			await saveOptionProduct(t, ownerId, {
				name: `Boots excluded ${status}`,
				categoryId: category._id,
				status,
				variants: [{ options: [{ name: 'Color', value: status === 'active' ? 'Azul' : 'Rojo' }] }]
			});
		}

		const query = api.tables.products.queries.fetchAllProductsPublic.fetchAllProductsPublic;
		const firstPage = await t.query(query, {
			paginationOpts: { cursor: null, numItems: 12 },
			search,
			filters: { color: 'rojo' }
		});
		expect(firstPage.items).toHaveLength(12);
		expect(firstPage.hasNextPage).toBe(true);
		expect(firstPage.total).toBeUndefined();

		const secondPage = await t.query(query, {
			paginationOpts: { cursor: firstPage.nextCursor, numItems: 12 },
			search,
			filters: { color: 'rojo' }
		});
		expect(secondPage.items).toHaveLength(12);
		expect(secondPage.hasNextPage).toBe(true);
		const thirdPage = await t.query(query, {
			paginationOpts: { cursor: secondPage.nextCursor, numItems: 12 },
			search,
			filters: { color: 'rojo' }
		});
		expect(thirdPage.items).toHaveLength(1);
		expect(thirdPage.hasNextPage).toBe(false);
		expect(thirdPage.nextCursor).toBeNull();
		const ids = [...firstPage.items, ...secondPage.items, ...thirdPage.items].map(
			(item) => item._id
		);
		expect(ids.sort()).toEqual(expectedIds.sort());
		expect(new Set(ids).size).toBe(25);
		const previous = await t.query(query, {
			paginationOpts: { cursor: firstPage.nextCursor, numItems: 12 },
			search,
			filters: { color: 'rojo' }
		});
		expect(previous.items.map((item) => item._id)).toEqual(
			secondPage.items.map((item) => item._id)
		);
	}
);

test('combines search with option filters and requires all options on one variant', async () => {
	const t = createTestContext();
	const ownerId = 'option-search-admin';
	const admin = t.withIdentity({ tokenIdentifier: ownerId, subject: ownerId, role: 'admin' });
	const category = await admin.mutation(
		api.tables.categories.mutations.createCategory.createCategory,
		{ name: 'Option search', status: 'active' }
	);

	await saveOptionProduct(t, ownerId, {
		name: 'Canvas red jacket',
		categoryId: category._id,
		variants: [
			{
				options: [
					{ name: 'Color', value: 'Rojo' },
					{ name: 'Tallas', value: '5' }
				]
			}
		]
	});
	await saveOptionProduct(t, ownerId, {
		name: 'Canvas red shorts',
		categoryId: category._id,
		variants: [
			{
				options: [
					{ name: 'Color', value: 'Rojo' },
					{ name: 'Tallas', value: '3' }
				]
			}
		]
	});
	await saveOptionProduct(t, ownerId, {
		name: 'Canvas blue cap',
		categoryId: category._id,
		variants: [
			{
				options: [
					{ name: 'Color', value: 'Azul' },
					{ name: 'Tallas', value: '4' }
				]
			}
		]
	});
	await saveOptionProduct(t, ownerId, {
		name: 'Other red shoes',
		categoryId: category._id,
		variants: [{ options: [{ name: 'Color', value: 'Rojo' }] }]
	});

	const query = api.tables.products.queries.fetchAllProductsPublic.fetchAllProductsPublic;
	const searched = await t.query(query, {
		paginationOpts: { cursor: null, numItems: 12 },
		search: 'Canvas',
		filters: { color: 'rojo' }
	});
	expect(searched.items.map((product) => product.name).sort()).toEqual([
		'Canvas red jacket',
		'Canvas red shorts'
	]);
	expect(searched.total).toBeUndefined();
	const split = await saveOptionProduct(t, ownerId, {
		name: 'Canvas split options',
		categoryId: category._id,
		variants: [
			{
				options: [
					{ name: 'Color', value: 'Rojo' },
					{ name: 'Tallas', value: '3' }
				]
			},
			{
				options: [
					{ name: 'Color', value: 'Azul' },
					{ name: 'Tallas', value: '5' }
				]
			}
		]
	});
	const combined = await t.query(query, {
		paginationOpts: { cursor: null, numItems: 12 },
		search: 'Canvas',
		filters: {
			color: 'rojo',
			age: '5',
			category: category.slug,
			gender: 'unisex',
			ageGroup: 'adults'
		}
	});
	expect(combined.items.map((item) => item.name)).toEqual(['Canvas red jacket']);
	expect(combined.items.some((item) => item._id === split)).toBe(false);
	const excludedFilters: Record<string, string>[] = [
		{ color: 'verde' },
		{ color: 'rojo', age: '4' },
		{ color: 'rojo', category: 'missing' },
		{ color: 'rojo', ageGroup: 'kids' },
		{ color: 'rojo', gender: 'female' },
		{ color: 'rojo', ageGroup: 'invalid' },
		{ color: 'rojo', gender: 'invalid' },
		{ ageGroup: 'invalid' },
		{ gender: 'invalid' }
	];
	for (const filters of excludedFilters) {
		const empty = await t.query(query, {
			paginationOpts: { cursor: null, numItems: 12 },
			search: 'Canvas',
			filters
		});
		expect(empty.items).toEqual([]);
		expect(empty.nextCursor).toBeNull();
	}
});

test('removes product option index rows when a product is deleted', async () => {
	const t = createTestContext();
	const ownerId = 'option-delete-admin';
	const admin = t.withIdentity({ tokenIdentifier: ownerId, subject: ownerId, role: 'admin' });
	const category = await admin.mutation(
		api.tables.categories.mutations.createCategory.createCategory,
		{ name: 'Option deletion', status: 'active' }
	);

	const firstId = await saveOptionProduct(t, ownerId, {
		name: 'First red shirt',
		categoryId: category._id,
		status: 'draft',
		variants: [
			{
				options: [
					{ name: 'Color', value: 'Rojo' },
					{ name: 'Tallas', value: '5' }
				]
			}
		]
	});
	const secondId = await saveOptionProduct(t, ownerId, {
		name: 'Second red shirt',
		categoryId: category._id,
		status: 'draft',
		variants: [
			{
				options: [
					{ name: 'Color', value: 'Rojo' },
					{ name: 'Tallas', value: '3' }
				]
			}
		]
	});

	await admin.mutation(api.tables.products.mutations.deleteProduct.deleteProduct, {
		id: firstId
	});
	const remainingRows = await t.run((ctx) => ctx.db.query('productOptionIndex').collect());
	expect(remainingRows).toHaveLength(8); // 4 keys (including membership) in 2 scopes.
	expect(remainingRows.every((row) => row.productId === secondId)).toBe(true);

	await admin.mutation(api.tables.products.mutations.deleteProduct.deleteProduct, {
		id: secondId
	});
	await new Promise((resolve) => setTimeout(resolve, 0));
	await t.finishInProgressScheduledFunctions();
	expect(await t.run((ctx) => ctx.db.query('productOptionIndex').collect())).toEqual([]);
});

test('backfills search names in place for existing option rows', async () => {
	const t = createTestContext();
	migrationsTest.register(t);
	const categoryId = await t.run((ctx) =>
		ctx.db.insert('categories', {
			name: 'Backfill',
			slug: 'backfill',
			status: 'active'
		})
	);
	const productId = await saveOptionProduct(t, 'backfill-admin', {
		name: 'Legacy boots',
		categoryId,
		variants: [{ options: [{ name: 'Color', value: 'Rojo' }] }]
	});
	const before = await t.run(async (ctx) => {
		const rows = await ctx.db.query('productOptionIndex').collect();
		for (const row of rows) await ctx.db.patch(row._id, { name: undefined });
		return rows;
	});
	await t.run(async (ctx) => {
		await runToCompletion(
			ctx,
			components.migrations,
			internal.tables.productOptionIndex.migrations.backfillProductOptionIndex
				.backfillProductOptionNames
		);
	});
	const after = await t.run((ctx) => ctx.db.query('productOptionIndex').collect());
	expect(after).toEqual(before);
	const result = await t.query(
		api.tables.products.queries.fetchAllProductsPublic.fetchAllProductsPublic,
		{
			paginationOpts: { cursor: null, numItems: 12 },
			search: 'boots',
			filters: { color: 'rojo' }
		}
	);
	expect(result.items.map((item) => item._id)).toEqual([productId]);
});
