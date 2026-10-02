/// <reference types="vite/client" />

import aggregateTest from '@convex-dev/aggregate/test';
import migrationsTest from '@convex-dev/migrations/test';
import { runToCompletion } from '@convex-dev/migrations';
import { convexTest } from 'convex-test';
import { expect, test } from 'vitest';

import { components, internal } from '../../src/convex/_generated/api';
import schema from '../../src/convex/schema';

const modules = import.meta.glob('../../src/convex/**/*.ts');

function createTestContext() {
	const t = convexTest(schema, modules);
	aggregateTest.register(t, 'productsAggregate');
	aggregateTest.register(t, 'categoriesAggregate');
	migrationsTest.register(t);
	return t;
}

test('renames Size to Tallas, maps 0/00 to 6M/3M, and splits 3-6M into two variants', async () => {
	const t = createTestContext();
	const fixture = await t.run(async (ctx) => {
		const categoryId = await ctx.db.insert('categories', {
			name: 'Bebé',
			slug: 'bebe',
			status: 'active'
		});
		const productId = await ctx.db.insert('products', {
			name: 'Conjunto bebé',
			slug: 'conjunto-bebe',
			description: '',
			productVariantOptionNames: ['Color', 'Size'],
			priceInCents: 100,
			hasPriceRange: true,
			categoryIds: [categoryId],
			imageKeys: ['products/library'],
			storagePrefix: 'products',
			trackInventory: true,
			upsellProductIds: [],
			status: 'active'
		});
		const legacyZero = await ctx.db.insert('productVariants', {
			productId,
			position: 0,
			options: [
				{ name: 'Color', value: 'Negro' },
				{ name: 'Size', value: '0' }
			],
			sku: 'CON-BEB-NEG-0',
			imageKeys: [],
			priceInCents: 100,
			inventory: 5,
			reservedInventory: 0
		});
		const combinedBlanco = await ctx.db.insert('productVariants', {
			productId,
			position: 1,
			options: [
				{ name: 'Color', value: 'Blanco' },
				{ name: 'Size', value: '3-6M' }
			],
			sku: 'CON-BEB-BLA-3-6M',
			imageKeys: ['products/variant-a'],
			priceInCents: 150,
			inventory: 7,
			reservedInventory: 2
		});
		const combinedBeige = await ctx.db.insert('productVariants', {
			productId,
			position: 2,
			options: [
				{ name: 'Color', value: 'Beige' },
				{ name: 'Size', value: '3-6M' }
			],
			sku: 'CUSTOM-SKU',
			imageKeys: [],
			priceInCents: 200,
			inventory: 0,
			reservedInventory: 0
		});
		const legacyDoubleZero = await ctx.db.insert('productVariants', {
			productId,
			position: 3,
			options: [{ name: 'Size', value: '00' }],
			sku: 'CON-BEB-00',
			imageKeys: [],
			priceInCents: 100,
			inventory: 0,
			reservedInventory: 0
		});

		return { productId, legacyZero, combinedBlanco, combinedBeige, legacyDoubleZero };
	});

	for (let run = 0; run < 2; run++) {
		await t.run((ctx) =>
			runToCompletion(
				ctx,
				components.migrations,
				internal.tables.productVariants.migrations.backfillTallasMonthSizes.backfillTallasMonthSizes
			)
		);
	}

	const state = await t.run(async (ctx) => ({
		product: await ctx.db.get(fixture.productId),
		variants: await ctx.db
			.query('productVariants')
			.withIndex('by_product_id', (query) => query.eq('productId', fixture.productId))
			.collect(),
		indexRows: await ctx.db
			.query('productOptionIndex')
			.withIndex('by_product_id', (query) => query.eq('productId', fixture.productId))
			.collect()
	}));

	expect(state.product?.productVariantOptionNames).toEqual(['Color', 'Tallas']);
	expect(state.variants).toHaveLength(6);

	const variantById = new Map(state.variants.map((variant) => [variant._id, variant]));

	expect(variantById.get(fixture.legacyZero)?.options).toEqual([
		{ name: 'Color', value: 'Negro' },
		{ name: 'Tallas', value: '6M' }
	]);

	const threeMonthBlanco = state.variants.find(
		(variant) =>
			variant.options.some((option) => option.value === 'Blanco') &&
			variant.options.some((option) => option.value === '3M')
	);
	expect(threeMonthBlanco).toMatchObject({
		_id: fixture.combinedBlanco,
		sku: 'CON-BEB-BLA-3M',
		inventory: 7,
		reservedInventory: 2,
		priceInCents: 150,
		imageKeys: ['products/variant-a']
	});

	const sixMonthBlanco = state.variants.find(
		(variant) =>
			variant.options.some((option) => option.value === 'Blanco') &&
			variant.options.some((option) => option.value === '6M')
	);
	expect(sixMonthBlanco).toMatchObject({
		position: 1,
		sku: 'CON-BEB-BLA-6M',
		inventory: 0,
		reservedInventory: 0,
		priceInCents: 150,
		imageKeys: ['products/variant-a']
	});

	const threeMonthBeige = state.variants.find(
		(variant) =>
			variant.options.some((option) => option.value === 'Beige') &&
			variant.options.some((option) => option.value === '3M')
	);
	expect(threeMonthBeige).toMatchObject({ _id: fixture.combinedBeige, sku: 'CUSTOM-SKU-3M' });

	const sixMonthBeige = state.variants.find(
		(variant) =>
			variant.options.some((option) => option.value === 'Beige') &&
			variant.options.some((option) => option.value === '6M')
	);
	expect(sixMonthBeige).toMatchObject({ sku: 'CUSTOM-SKU-6M' });

	expect(variantById.get(fixture.legacyDoubleZero)?.options).toEqual([
		{ name: 'Tallas', value: '3M' }
	]);

	const selectionKeys = new Set(state.indexRows.map((row) => row.optionKey));
	for (const optionKey of [
		'tallas:6m',
		'color:blanco|tallas:3m',
		'color:blanco|tallas:6m',
		'color:beige|tallas:3m',
		'color:beige|tallas:6m'
	]) {
		expect(selectionKeys.has(optionKey)).toBe(true);
	}
	expect(state.indexRows).toHaveLength(22);
});
