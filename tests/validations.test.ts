import { expect, test } from 'vitest';
import { overwriteGetLocale } from '../src/lib/paraglide/runtime.js';
import { saveProductSchema } from '../src/shared/features/products/schemas/productsSchemas.js';
import { toHumanMessage } from '../src/features/validations/utils/toHumanMessage.js';

test('built-in schema issues use the existing validation message mapping', () => {
	overwriteGetLocale(() => 'en');
	const parsed = saveProductSchema.safeParse({
		name: '',
		description: 'Details',
		categoryId: 'category'
	});
	expect(parsed.success).toBe(false);
	if (parsed.success) throw new Error('Expected an empty name to fail validation');
	expect(parsed.error.issues[0].code).toBe('too_small');
	expect(toHumanMessage(parsed.error.issues[0].message)).toBe('Please enter a valid value.');
	expect(toHumanMessage('Unknown validation error')).toBe('Please check this field.');
});

test('original price must be higher than the variant price', () => {
	overwriteGetLocale(() => 'en');
	const parsed = saveProductSchema.safeParse({
		name: 'Sale product',
		description: 'Details',
		trackInventory: true,
		categoryId: 'category',
		productVariantOptionNames: [],
		productVariants: [
			{
				options: [],
				sku: '',
				imageKeys: [],
				priceInCents: 5999,
				compareAtPriceInCents: 5999,
				inventory: 0
			}
		]
	});
	expect(parsed.success).toBe(false);
	if (parsed.success) throw new Error('Expected an invalid original price to fail validation');
	expect(parsed.error.issues[0]?.path).toEqual(['productVariants', 0, 'compareAtPriceInCents']);
	expect(parsed.error.issues[0]?.message).toBe('COMPARE_AT_PRICE_MUST_EXCEED_PRICE');
	expect(toHumanMessage(parsed.error.issues[0]?.message ?? '')).toBe(
		'Discounted price must be lower than Price.'
	);
});

test('rejects duplicate option names and duplicate variant combinations', () => {
	overwriteGetLocale(() => 'en');
	const base = {
		name: 'Variant product',
		description: 'Details',
		trackInventory: true,
		categoryId: 'category'
	};

	const duplicateOption = saveProductSchema.safeParse({
		...base,
		productVariantOptionNames: ['Color', 'color'],
		productVariants: [
			{
				options: [{ name: 'Color', value: 'Red' }],
				sku: '',
				imageKeys: [],
				priceInCents: 100,
				inventory: 0
			}
		]
	});
	expect(duplicateOption.success).toBe(false);
	if (duplicateOption.success)
		throw new Error('Expected duplicate option names to fail validation');
	expect(duplicateOption.error.issues[0]?.message).toBe('DUPLICATE_PRODUCT_VARIANT_OPTION');

	const duplicateCombination = saveProductSchema.safeParse({
		...base,
		productVariantOptionNames: ['Color'],
		productVariants: [
			{
				options: [{ name: 'Color', value: 'Red' }],
				sku: '',
				imageKeys: [],
				priceInCents: 100,
				inventory: 0
			},
			{
				options: [{ name: 'Color', value: 'red' }],
				sku: '',
				imageKeys: [],
				priceInCents: 100,
				inventory: 0
			}
		]
	});
	expect(duplicateCombination.success).toBe(false);
	if (duplicateCombination.success) {
		throw new Error('Expected duplicate variant combinations to fail validation');
	}
	expect(
		duplicateCombination.error.issues.some((issue) => issue.message === 'DUPLICATE_PRODUCT_VARIANT')
	).toBe(true);
	expect(toHumanMessage('DUPLICATE_PRODUCT_VARIANT')).toBe(
		'Two product variants cannot use the same option values.'
	);
});

test.each([-1, 0.5, Number.MAX_SAFE_INTEGER + 1])('rejects invalid stock %s', (inventory) => {
	expect(
		saveProductSchema.safeParse({
			name: 'Product',
			description: 'Description',
			trackInventory: true,
			categoryId: 'category',
			productVariantOptionNames: [],
			productVariants: [{ options: [], sku: '', imageKeys: [], priceInCents: 100, inventory }]
		}).success
	).toBe(false);
});

test('requires an explicit inventory tracking choice', () => {
	const input = {
		name: 'Product',
		description: 'Description',
		categoryId: 'category',
		productVariantOptionNames: [],
		productVariants: [{ options: [], sku: '', imageKeys: [], priceInCents: 100, inventory: 0 }]
	};

	expect(saveProductSchema.safeParse(input).success).toBe(false);
	expect(saveProductSchema.safeParse({ ...input, trackInventory: 'yes' }).success).toBe(false);
	expect(saveProductSchema.safeParse({ ...input, trackInventory: false }).success).toBe(true);
});
