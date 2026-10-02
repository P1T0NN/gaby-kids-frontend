/// <reference types="vite/client" />

import aggregateTest from '@convex-dev/aggregate/test';
import actionRetrierTest from '@convex-dev/action-retrier/test';
import rateLimiterTest from '@convex-dev/rate-limiter/test';
import { AuditActions } from 'convex-audit-log';
import auditLogTest from 'convex-audit-log/test';
import { convexTest } from 'convex-test';
import r2Test from '@convex-dev/r2/test';
import { expect, test } from 'vitest';
import migrationsTest from '@convex-dev/migrations/test';
import { runToCompletion } from '@convex-dev/migrations';
import type { FunctionReturnType } from 'convex/server';

import { api, components, internal } from '../../src/convex/_generated/api';
import schema from '../../src/convex/schema';

import { CATEGORY_CONFIG } from '../../src/shared/features/categories/config';

const modules = import.meta.glob('../../src/convex/**/*.ts');

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

const PRODUCT_IMAGE_KEY = 'products/test-image';

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

test('reuses one category across products', async () => {
	const t = createTestContext();
	const admin = t.withIdentity({
		tokenIdentifier: 'category-admin',
		subject: 'category-admin',
		role: 'admin'
	});

	const category = await admin.mutation(
		api.tables.categories.mutations.createCategory.createCategory,
		{
			name: 'T-Shirts',
			status: 'active'
		}
	);

	const adminPage = await admin.query(
		api.tables.categories.queries.fetchCategoriesAdmin.fetchCategoriesAdmin,
		{ paginationOpts: { numItems: 10, cursor: null } }
	);
	const searchedAdminPage = await admin.query(
		api.tables.categories.queries.fetchCategoriesAdmin.fetchCategoriesAdmin,
		{ paginationOpts: { numItems: 10, cursor: null }, search: 'T-Shirts' }
	);

	expect(adminPage.total).toBe(1);
	expect(searchedAdminPage.items.map((item) => item.slug)).toEqual(['t-shirts']);
	expect(searchedAdminPage.total).toBeUndefined();

	for (const name of ['Blue T-Shirt', 'Red T-Shirt', 'Green T-Shirt']) {
		await insertProductImageUpload(t, 'category-admin');
		await admin.mutation(api.tables.products.mutations.saveProduct.saveProduct, {
			name,
			description: `${name} description.`,
			trackInventory: true,
			categoryIds: [category._id],
			productVariantOptionNames: [],
			productVariants: [
				{ options: [], sku: '', imageKeys: [PRODUCT_IMAGE_KEY], priceInCents: 100, inventory: 0 }
			],
			uploadedFiles: [PRODUCT_IMAGE_KEY]
		});
	}
	const otherCategory = await admin.mutation(
		api.tables.categories.mutations.createCategory.createCategory,
		{ name: 'Bags', status: 'active' }
	);
	await insertProductImageUpload(t, 'category-admin');
	await admin.mutation(api.tables.products.mutations.saveProduct.saveProduct, {
		name: 'Canvas Backpack',
		description: 'A product in another category.',
		trackInventory: true,
		categoryIds: [otherCategory._id],
		productVariantOptionNames: [],
		productVariants: [
			{ options: [], sku: '', imageKeys: [PRODUCT_IMAGE_KEY], priceInCents: 100, inventory: 0 }
		],
		uploadedFiles: [PRODUCT_IMAGE_KEY]
	});

	const options = await t.query(
		api.tables.categories.queries.fetchCategoryOptions.fetchCategoryOptions,
		{}
	);
	const page = await t.query(
		api.tables.products.queries.fetchAllProductsPublic.fetchAllProductsPublic,
		{
			paginationOpts: { numItems: 10, cursor: null },
			filters: { category: 't-shirts' }
		}
	);

	expect(options.map((option) => option.slug)).toContain('t-shirts');
	expect(page.items).toEqual([]);
});

test('validates category slugs, assignments, and archive behavior', async () => {
	const t = createTestContext();
	const user = t.withIdentity({ tokenIdentifier: 'category-user', subject: 'category-user' });
	const admin = t.withIdentity({
		tokenIdentifier: 'category-validation-admin',
		subject: 'category-validation-admin',
		role: 'admin'
	});

	await expect(
		user.mutation(api.tables.categories.mutations.createCategory.createCategory, {
			name: 'Forbidden',
			status: 'active'
		})
	).rejects.toMatchObject({ data: { code: 'FORBIDDEN' } });

	const category = await admin.mutation(
		api.tables.categories.mutations.createCategory.createCategory,
		{
			name: 'Accessories',
			status: 'active'
		}
	);

	await expect(
		admin.mutation(api.tables.categories.mutations.createCategory.createCategory, {
			name: 'Accessories',
			status: 'active'
		})
	).rejects.toMatchObject({ data: { code: 'CATEGORY_SLUG_TAKEN' } });

	await insertProductImageUpload(t, 'category-validation-admin');
	const product = await admin.mutation(api.tables.products.mutations.saveProduct.saveProduct, {
		name: 'Archive-safe product',
		description: 'Its category assignment is retained when the category is archived.',
		trackInventory: true,
		categoryIds: [category._id],
		productVariantOptionNames: [],
		productVariants: [
			{ options: [], sku: '', imageKeys: [PRODUCT_IMAGE_KEY], priceInCents: 100, inventory: 0 }
		],
		uploadedFiles: [PRODUCT_IMAGE_KEY]
	});

	await admin.mutation(api.tables.categories.mutations.updateCategory.updateCategory, {
		id: category._id,
		name: category.name,
		status: 'archived'
	});

	const options = await t.query(
		api.tables.categories.queries.fetchCategoryOptions.fetchCategoryOptions,
		{}
	);
	const archivedProduct = await admin.query(
		api.tables.products.queries.fetchProductById.fetchProductById,
		{
			id: product._id
		}
	);

	expect(options.map((option) => option.slug)).not.toContain('accessories');
	expect(archivedProduct.categoryIds).toEqual([category._id]);
});

test('regenerates the category slug when its name changes', async () => {
	const t = createTestContext();
	const admin = t.withIdentity({
		tokenIdentifier: 'category-rename-admin',
		subject: 'category-rename-admin',
		role: 'admin'
	});

	const category = await admin.mutation(
		api.tables.categories.mutations.createCategory.createCategory,
		{
			name: 'Summer Sale',
			status: 'active'
		}
	);

	const renamed = await admin.mutation(
		api.tables.categories.mutations.updateCategory.updateCategory,
		{
			id: category._id,
			name: 'Winter Sale',
			status: 'active'
		}
	);

	expect(renamed).toMatchObject({ name: 'Winter Sale', slug: 'winter-sale' });
});

test('stores one optional category image in the category namespace', async () => {
	const t = createTestContext();
	const admin = t.withIdentity({
		tokenIdentifier: 'category-image-admin',
		subject: 'category-image-admin',
		role: 'admin'
	});
	const imageKey = 'categories/category-image';

	await t.run(async (ctx) => {
		await ctx.db.insert('storageUploads', {
			ownerId: 'category-image-admin',
			key: imageKey,
			expectedSize: 1,
			expectedContentType: 'image/webp',
			status: 'uploaded',
			createdAt: Date.now()
		});
	});

	const category = await admin.mutation(
		api.tables.categories.mutations.createCategory.createCategory,
		{
			name: 'Image category',
			status: 'active',
			uploadedFiles: [imageKey]
		}
	);

	expect(category.imageKey).toBe(imageKey);
	const fetched = await admin.query(api.tables.categories.queries.fetchCategory.fetchCategory, {
		id: category._id
	});
	expect(fetched.imageKey).toBe(imageKey);
	expect(fetched.image).toBe(`https://cdn.example.com/${imageKey}`);
});

test('fetches every active category with its resolved image, sorted by name', async () => {
	const t = createTestContext();
	const admin = t.withIdentity({
		tokenIdentifier: 'category-fetch-admin',
		subject: 'category-fetch-admin',
		role: 'admin'
	});
	const imageKey = 'categories/fetch-categories-image';

	await t.run((ctx) =>
		ctx.db.insert('storageUploads', {
			ownerId: 'category-fetch-admin',
			key: imageKey,
			expectedSize: 1,
			expectedContentType: 'image/webp',
			status: 'uploaded',
			createdAt: Date.now()
		})
	);

	await admin.mutation(api.tables.categories.mutations.createCategory.createCategory, {
		name: 'Zeta',
		status: 'active',
		uploadedFiles: [imageKey]
	});
	await admin.mutation(api.tables.categories.mutations.createCategory.createCategory, {
		name: 'Alpha',
		status: 'active'
	});
	const archived = await admin.mutation(
		api.tables.categories.mutations.createCategory.createCategory,
		{ name: 'Archived', status: 'active' }
	);
	await admin.mutation(api.tables.categories.mutations.updateCategory.updateCategory, {
		id: archived._id,
		name: archived.name,
		status: 'archived'
	});

	const categories = await t.query(
		api.tables.categories.queries.fetchCategories.fetchCategories,
		{}
	);

	expect(categories.map((category) => category.name)).toEqual(['Alpha', 'Zeta']);
	expect(categories.find((category) => category.name === 'Zeta')).toMatchObject({
		image: `https://cdn.example.com/${imageKey}`
	});
});

test('blocks category deletion while products are assigned and preserves their references', async () => {
	const t = createTestContext();
	const admin = t.withIdentity({
		tokenIdentifier: 'category-linked-delete-admin',
		subject: 'category-linked-delete-admin',
		role: 'admin'
	});
	const category = await admin.mutation(
		api.tables.categories.mutations.createCategory.createCategory,
		{
			name: 'Linked category',
			status: 'active'
		}
	);
	const productNames = Array.from(
		{ length: CATEGORY_CONFIG.maxCategoryProductNames + 1 },
		(_, index) => `Linked product ${index + 1}`
	);
	const products = [];

	for (const name of productNames) {
		await insertProductImageUpload(t, 'category-linked-delete-admin');
		products.push(
			await admin.mutation(api.tables.products.mutations.saveProduct.saveProduct, {
				name,
				description: `${name} description.`,
				trackInventory: true,
				categoryIds: [category._id],
				productVariantOptionNames: [],
				productVariants: [
					{ options: [], sku: '', imageKeys: [PRODUCT_IMAGE_KEY], priceInCents: 100, inventory: 0 }
				],
				uploadedFiles: [PRODUCT_IMAGE_KEY]
			})
		);
	}

	await expect(
		admin.mutation(api.tables.categories.mutations.deleteCategory.deleteCategory, {
			id: category._id
		})
	).rejects.toMatchObject({
		data: {
			code: 'CATEGORY_HAS_PRODUCTS',
			productCount: productNames.length,
			productNames: productNames.slice(0, CATEGORY_CONFIG.maxCategoryProductNames)
		}
	});

	const product = await admin.query(api.tables.products.queries.fetchProductById.fetchProductById, {
		id: products[0]!._id
	});
	expect(product.categoryIds).toEqual([category._id]);
});

test('deletes an unassigned category only for admins and writes an audit event', async () => {
	const t = createTestContext();
	const user = t.withIdentity({
		tokenIdentifier: 'category-delete-user',
		subject: 'category-delete-user'
	});
	const admin = t.withIdentity({
		tokenIdentifier: 'category-delete-admin',
		subject: 'category-delete-admin',
		role: 'admin'
	});
	const category = await admin.mutation(
		api.tables.categories.mutations.createCategory.createCategory,
		{
			name: 'Deletable category',
			status: 'active'
		}
	);

	await expect(
		user.mutation(api.tables.categories.mutations.deleteCategory.deleteCategory, {
			id: category._id
		})
	).rejects.toMatchObject({ data: { code: 'FORBIDDEN' } });

	await expect(
		admin.mutation(api.tables.categories.mutations.deleteCategory.deleteCategory, {
			id: category._id
		})
	).resolves.toBeNull();

	await expect(
		admin.query(api.tables.categories.queries.fetchCategory.fetchCategory, { id: category._id })
	).rejects.toMatchObject({ data: { code: 'CATEGORY_NOT_FOUND' } });

	// Scheduled audit writes use real timers; give the timer a turn before draining.
	await new Promise((resolve) => setTimeout(resolve, 0));
	await t.finishInProgressScheduledFunctions();
	const auditLogs = await admin.query(
		api.auditLogs.queries.fetchAuditLogsAdmin.fetchAuditLogsAdmin,
		{ paginationOpts: { numItems: 50, cursor: null } }
	);
	expect(auditLogs.items).toEqual(
		expect.arrayContaining([
			expect.objectContaining({
				action: AuditActions.RECORD_DELETED,
				resourceType: 'categories',
				resourceId: category._id,
				severity: 'warning'
			})
		])
	);
});

test('deletes an assigned category image from R2 metadata', async () => {
	const t = createTestContext();
	const admin = t.withIdentity({
		tokenIdentifier: 'category-image-delete-admin',
		subject: 'category-image-delete-admin',
		role: 'admin'
	});
	const imageKey = 'categories/deletable-category-image';
	const storageConfig = {
		bucket: 'test-bucket',
		endpoint: 'https://test-account.r2.cloudflarestorage.com',
		accessKeyId: 'test-access-key',
		secretAccessKey: 'test-secret-key'
	};

	const categoryId = await t.run(async (ctx) => {
		const id = await ctx.db.insert('categories', {
			name: 'Image cleanup category',
			slug: 'image-cleanup-category',
			status: 'active',
			imageKey
		});
		await ctx.runMutation(components.r2.lib.upsertMetadata, {
			key: imageKey,
			contentType: 'image/webp',
			size: 1,
			sha256: 'test-sha',
			lastModified: new Date().toISOString(),
			bucket: storageConfig.bucket,
			link: `https://dash.cloudflare.com/test/${imageKey}`
		});
		return id;
	});

	const existingMetadata = await t.run((ctx) =>
		ctx.runQuery(components.r2.lib.getMetadata, { ...storageConfig, key: imageKey })
	);
	expect(existingMetadata).not.toBeNull();

	await admin.mutation(api.tables.categories.mutations.deleteCategory.deleteCategory, {
		id: categoryId
	});

	const deletedMetadata = await t.run((ctx) =>
		ctx.runQuery(components.r2.lib.getMetadata, { ...storageConfig, key: imageKey })
	);
	expect(deletedMetadata).toBeNull();
});

test('multiple categories preserve search/option pagination, counts, reassignment and deletion', async () => {
	const t = createTestContext();
	const ownerId = 'multi-category-admin';
	const admin = t.withIdentity({ tokenIdentifier: ownerId, subject: ownerId, role: 'admin' });
	const create = api.tables.categories.mutations.createCategory.createCategory;
	const first = await admin.mutation(create, { name: 'First category', status: 'active' });
	const second = await admin.mutation(create, { name: 'Second category', status: 'active' });
	const save = api.tables.products.mutations.saveProduct.saveProduct;
	const input = {
		description: 'Shared product',
		trackInventory: false,
		categoryIds: [first._id, second._id],
		gender: 'female' as const,
		productVariantOptionNames: ['Color', 'Tallas'],
		productVariants: [
			{
				options: [
					{ name: 'Color', value: 'Blanco' },
					{ name: 'Tallas', value: '6M' }
				],
				sku: '',
				imageKeys: [PRODUCT_IMAGE_KEY],
				priceInCents: 100,
				inventory: 0
			}
		]
	};
	const products = [];
	for (let index = 0; index < 5; index++) {
		await insertProductImageUpload(t, ownerId);
		products.push(
			await admin.mutation(save, {
				...input,
				name: 'Shared product ' + index,
				status: index === 4 ? 'draft' : 'active',
				uploadedFiles: [PRODUCT_IMAGE_KEY]
			})
		);
	}
	const query = api.tables.products.queries.fetchAllProductsPublic.fetchAllProductsPublic;
	for (const category of [undefined, first.slug, second.slug]) {
		for (const search of [undefined, 'Shared']) {
			for (const options of [
				{ color: '', age: '' },
				{ color: 'blanco', age: '6M' }
			]) {
				const ids: string[] = [];
				let cursor: string | null = null;
				const filters = { ...options, category: category ?? '', gender: 'female' };
				do {
					const page: FunctionReturnType<typeof query> = await t.query(query, {
						paginationOpts: { cursor, numItems: 2 },
						search,
						filters
					});
					ids.push(...page.items.map((product) => product._id));
					cursor = page.nextCursor;
				} while (cursor);
				expect(ids).toHaveLength(4);
				expect(new Set(ids)).toEqual(new Set(products.slice(0, 4).map((product) => product._id)));
			}
		}
	}
	const detail = await admin.query(api.tables.products.queries.fetchProductById.fetchProductById, {
		id: products[0]._id
	});
	expect(detail.categoryOptions.map((category) => category._id)).toEqual(input.categoryIds);
	expect(detail.categoryOption._id).toBe(first._id);
	expect(detail.categoryId).toBe(first._id);
	const { categoryIds: _categoryIds, ...legacyInput } = input;
	const legacySaved = await admin.mutation(save, {
		...legacyInput,
		id: products[0]._id,
		name: products[0].name,
		categoryId: first._id
	});
	expect(legacySaved.categoryIds).toEqual(input.categoryIds);
	await expect(
		admin.mutation(api.tables.categories.mutations.deleteCategory.deleteCategory, {
			id: second._id
		})
	).rejects.toMatchObject({ data: { code: 'CATEGORY_HAS_PRODUCTS', productCount: 5 } });
	for (const product of products) {
		await admin.mutation(save, {
			...input,
			name: product.name,
			id: product._id,
			categoryIds: [first._id]
		});
	}
	expect(
		(
			await t.query(query, {
				paginationOpts: { cursor: null, numItems: 10 },
				filters: { category: second.slug }
			})
		).items
	).toEqual([]);
	await admin.mutation(api.tables.categories.mutations.deleteCategory.deleteCategory, {
		id: second._id
	});
	await admin.mutation(save, {
		...input,
		categoryIds: [first._id],
		name: products[0].name,
		id: products[0]._id,
		status: 'draft'
	});
	await admin.mutation(api.tables.products.mutations.deleteProduct.deleteProduct, {
		id: products[0]._id
	});
	await expect(
		admin.mutation(api.tables.categories.mutations.deleteCategory.deleteCategory, { id: first._id })
	).rejects.toMatchObject({ data: { code: 'CATEGORY_HAS_PRODUCTS', productCount: 4 } });
});

test('multi-category validation rejects empty/duplicate assignments and archived publishing', async () => {
	const t = createTestContext();
	const ownerId = 'multi-category-validation';
	const admin = t.withIdentity({ tokenIdentifier: ownerId, subject: ownerId, role: 'admin' });
	const create = api.tables.categories.mutations.createCategory.createCategory;
	const first = await admin.mutation(create, { name: 'Active assignment', status: 'active' });
	const second = await admin.mutation(create, { name: 'Archived assignment', status: 'active' });
	const save = api.tables.products.mutations.saveProduct.saveProduct;
	const input = {
		name: 'Validated product',
		description: 'Two categories',
		trackInventory: false,
		categoryIds: [first._id, second._id],
		productVariantOptionNames: [],
		productVariants: [
			{ options: [], sku: '', imageKeys: [PRODUCT_IMAGE_KEY], priceInCents: 100, inventory: 0 }
		]
	};
	for (const categoryIds of [[], [first._id, first._id], Array(21).fill(first._id)]) {
		await expect(admin.mutation(save, { ...input, categoryIds })).rejects.toMatchObject({
			data: { code: 'INVALID_PRODUCT_DATA' }
		});
	}
	await insertProductImageUpload(t, ownerId);
	const product = await admin.mutation(save, { ...input, uploadedFiles: [PRODUCT_IMAGE_KEY] });
	await admin.mutation(api.tables.categories.mutations.updateCategory.updateCategory, {
		id: second._id,
		name: second.name,
		status: 'archived'
	});
	await admin.mutation(save, { ...input, id: product._id });
	await expect(
		admin.mutation(save, { ...input, id: product._id, status: 'active' })
	).rejects.toMatchObject({ data: { code: 'INVALID_CATEGORY_DATA' } });
	await expect(
		admin.mutation(save, { ...input, name: 'New archived assignment' })
	).rejects.toMatchObject({ data: { code: 'INVALID_CATEGORY_DATA' } });
	await admin.mutation(save, {
		...input,
		id: product._id,
		categoryIds: [first._id],
		status: 'active'
	});
});

test('category-array backfill converts legacy products and rebuilds global and category option rows', async () => {
	const t = createTestContext();
	migrationsTest.register(t);
	const legacy = await t.run(async (ctx) => {
		const categoryId = await ctx.db.insert('categories', {
			name: 'Legacy category',
			slug: 'legacy-category',
			status: 'active'
		});
		const id = await ctx.db.insert('products', {
			name: 'Legacy shirt',
			slug: 'legacy-shirt',
			description: '',
			categoryId,
			priceInCents: 100,
			hasPriceRange: false,
			productVariantOptionNames: ['Color'],
			imageKeys: [],
			storagePrefix: 'products',
			trackInventory: false,
			upsellProductIds: [],
			status: 'active'
		});
		await ctx.db.insert('productVariants', {
			productId: id,
			position: 0,
			options: [{ name: 'Color', value: 'Blanco' }],
			sku: 'LEGACY',
			imageKeys: [],
			priceInCents: 100,
			inventory: 0,
			reservedInventory: 0
		});
		return { id, categoryId };
	});
	for (let run = 0; run < 2; run++) {
		await t.run((ctx) =>
			runToCompletion(
				ctx,
				components.migrations,
				internal.tables.products.migrations.backfillProductCategories.backfillProductCategories,
				{ cursor: null }
			)
		);
	}
	const product = await t.run((ctx) => ctx.db.get(legacy.id));
	expect(product?.categoryIds).toEqual([legacy.categoryId]);
	expect(product?.categoryId).toBeUndefined();
	const rows = await t.run((ctx) =>
		ctx.db
			.query('productOptionIndex')
			.withIndex('by_product_id', (q) => q.eq('productId', legacy.id))
			.collect()
	);
	expect(rows).toHaveLength(4);
	const query = api.tables.products.queries.fetchAllProductsPublic.fetchAllProductsPublic;
	const filterVariants: { category?: string; color?: string }[] = [
		{ category: 'legacy-category' },
		{ color: 'blanco' },
		{ category: 'legacy-category', color: 'blanco' }
	];
	for (const filters of filterVariants) {
		expect(
			(await t.query(query, { paginationOpts: { cursor: null, numItems: 10 }, filters })).items.map(
				(product) => product._id
			)
		).toEqual([legacy.id]);
	}
	const admin = t.withIdentity({
		tokenIdentifier: 'legacy-admin',
		subject: 'legacy-admin',
		role: 'admin'
	});
	await expect(
		admin.mutation(api.tables.categories.mutations.deleteCategory.deleteCategory, {
			id: legacy.categoryId
		})
	).rejects.toMatchObject({ data: { code: 'CATEGORY_HAS_PRODUCTS', productCount: 1 } });
});
