import { expect, test } from 'vitest';
import { overwriteGetLocale } from '../src/lib/paraglide/runtime.js';
import { getProductVariantRowErrors } from '../src/features/productVariants/utils/getProductVariantRowErrors.js';

// TYPES
import type { ProductVariantFormValue } from '../src/shared/features/productVariants/types/productVariantTypes.js';

function createProductVariant(
	overrides: Partial<ProductVariantFormValue> = {}
): ProductVariantFormValue {
	return {
		id: '',
		options: [],
		sku: '',
		imageKeys: ['products/test-image.jpg'],
		price: '10.00',
		discountedPrice: '',
		inventory: '5',
		reservedInventory: 0,
		...overrides
	};
}

test('keeps valid product variant rows clean', () => {
	overwriteGetLocale(() => 'en');
	expect(getProductVariantRowErrors([createProductVariant()])).toEqual([{}]);
	expect(
		getProductVariantRowErrors([
			createProductVariant({ options: [{ name: 'Color', value: 'Red' }], sku: 'SHIRT-RED' }),
			createProductVariant({ options: [{ name: 'Color', value: 'Blue' }], sku: 'SHIRT-BLUE' })
		])
	).toEqual([{}, {}]);
});

test('flags missing prices and invalid discounted prices', () => {
	overwriteGetLocale(() => 'en');
	const missingPrice = getProductVariantRowErrors([createProductVariant({ price: '' })]);
	expect(missingPrice[0]?.price).toBe('Enter a price.');

	const invalidDiscount = getProductVariantRowErrors([
		createProductVariant({ price: '10.00', discountedPrice: '10.00' })
	]);
	expect(invalidDiscount[0]?.discountedPrice).toBe(
		'Discounted price must be lower than the price.'
	);
});

test('flags duplicate SKUs case-insensitively', () => {
	overwriteGetLocale(() => 'en');
	const errors = getProductVariantRowErrors([
		createProductVariant({ sku: 'SHIRT-RED' }),
		createProductVariant({ sku: 'shirt-red' })
	]);
	expect(errors[0]?.sku).toBe('Use a unique SKU.');
	expect(errors[1]?.sku).toBe('Use a unique SKU.');
});

test('flags missing option values and duplicate combinations', () => {
	overwriteGetLocale(() => 'en');
	const blankValue = getProductVariantRowErrors([
		createProductVariant({ options: [{ name: 'Color', value: ' ' }] })
	]);
	expect(blankValue[0]?.options).toBe('Enter a value for every option.');

	const duplicates = getProductVariantRowErrors([
		createProductVariant({ options: [{ name: 'Color', value: 'Red' }] }),
		createProductVariant({ options: [{ name: 'color', value: 'red' }] })
	]);
	expect(duplicates[0]?.combination).toBe(
		'Two product variants cannot use the same option values.'
	);
	expect(duplicates[1]?.combination).toBe(
		'Two product variants cannot use the same option values.'
	);
});

test('requires at least one image per product variant', () => {
	overwriteGetLocale(() => 'en');
	const errors = getProductVariantRowErrors([createProductVariant({ imageKeys: [] })]);
	expect(errors[0]?.images).toBe('Apply at least one image to this variant.');
});

test('flags invalid stock and stock below reserved units', () => {
	overwriteGetLocale(() => 'en');
	const invalidStock = getProductVariantRowErrors([createProductVariant({ inventory: '-1' })]);
	expect(invalidStock[0]?.inventory).toBe('Enter a whole number of 0 or more.');

	const belowReserved = getProductVariantRowErrors([
		createProductVariant({ inventory: '1', reservedInventory: 3 })
	]);
	expect(belowReserved[0]?.inventory).toBe("3 reserved — stock can't be lower.");
});
