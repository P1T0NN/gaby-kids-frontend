/// <reference types="vite/client" />

import aggregateTest from '@convex-dev/aggregate/test';
import actionRetrierTest from '@convex-dev/action-retrier/test';
import rateLimiterTest from '@convex-dev/rate-limiter/test';
import { AuditActions } from 'convex-audit-log';
import auditLogTest from 'convex-audit-log/test';
import { convexTest } from 'convex-test';
import r2Test from '@convex-dev/r2/test';
import { expect, test } from 'vitest';

import { api, components } from '../../src/convex/_generated/api';
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
		await admin.mutation(api.tables.products.mutations.saveProduct.saveProduct, {
			name,
			description: `${name} description.`,
			priceInCents: 100,
			categoryId: category._id
		});
	}
	const otherCategory = await admin.mutation(
		api.tables.categories.mutations.createCategory.createCategory,
		{ name: 'Bags', status: 'active' }
	);
	await admin.mutation(api.tables.products.mutations.saveProduct.saveProduct, {
		name: 'Canvas Backpack',
		description: 'A product in another category.',
		priceInCents: 100,
		categoryId: otherCategory._id
	});

	const options = await t.query(
		api.tables.categories.queries.fetchCategoryOptions.fetchCategoryOptions,
		{}
	);
	const page = await t.query(api.tables.products.queries.fetchAllProductsPublic.fetchAllProductsPublic, {
		paginationOpts: { numItems: 10, cursor: null },
		filters: { category: 't-shirts' }
	});

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

	const product = await admin.mutation(api.tables.products.mutations.saveProduct.saveProduct, {
		name: 'Archive-safe product',
		description: 'Its category assignment is retained when the category is archived.',
		priceInCents: 100,
		categoryId: category._id
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
	const archivedProduct = await admin.query(api.tables.products.queries.fetchProductById.fetchProductById, {
		id: product._id
	});

	expect(options.map((option) => option.slug)).not.toContain('accessories');
	expect(archivedProduct.categoryId).toBe(category._id);
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
		products.push(
			await admin.mutation(api.tables.products.mutations.saveProduct.saveProduct, {
				name,
				description: `${name} description.`,
				priceInCents: 100,
				categoryId: category._id
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
	expect(product.categoryId).toBe(category._id);
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
