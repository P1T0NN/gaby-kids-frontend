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

test('original price must be higher than the current price', () => {
	overwriteGetLocale(() => 'en');
	const parsed = saveProductSchema.safeParse({
		name: 'Sale product',
		description: 'Details',
		priceInCents: 5999,
		trackInventory: true,
		inventory: 0,
		compareAtPriceInCents: 5999,
		categoryId: 'category'
	});
	expect(parsed.success).toBe(false);
	if (parsed.success) throw new Error('Expected an invalid original price to fail validation');
	expect(parsed.error.issues[0]?.path).toEqual(['compareAtPriceInCents']);
	expect(parsed.error.issues[0]?.message).toBe('COMPARE_AT_PRICE_MUST_EXCEED_PRICE');
	expect(toHumanMessage(parsed.error.issues[0]?.message ?? '')).toBe(
		'Discounted price must be lower than Price.'
	);
});

test.each([-1, 0.5, Number.MAX_SAFE_INTEGER + 1])('rejects invalid stock %s', (inventory) => {
	expect(
		saveProductSchema.safeParse({
			name: 'Product',
			description: 'Description',
			priceInCents: 100,
			trackInventory: true,
			inventory,
			categoryId: 'category'
		}).success
	).toBe(false);
});

test('requires an explicit inventory tracking choice', () => {
	const input = {
		name: 'Product',
		description: 'Description',
		priceInCents: 100,
		inventory: 0,
		categoryId: 'category'
	};

	expect(saveProductSchema.safeParse(input).success).toBe(false);
	expect(saveProductSchema.safeParse({ ...input, trackInventory: 'yes' }).success).toBe(false);
	expect(saveProductSchema.safeParse({ ...input, trackInventory: false }).success).toBe(true);
});
