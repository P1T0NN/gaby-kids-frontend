import { expect, test } from 'vitest';
import {
	findProductVariantByOptionValues,
	getProductVariantOptionGroups
} from '../src/features/productVariants/utils/productVariantOptionGroups.js';

const productVariants = [
	{
		options: [
			{ name: 'Size', value: 'S' },
			{ name: 'Color', value: 'Red' }
		]
	},
	{
		options: [
			{ name: 'Size', value: 'M' },
			{ name: 'Color', value: 'Red' }
		]
	},
	{
		options: [
			{ name: 'Size', value: 'M' },
			{ name: 'Color', value: 'Blue' }
		]
	}
];

test('groups option values in product option order without duplicates', () => {
	expect(getProductVariantOptionGroups(['Size', 'Color'], productVariants)).toEqual([
		{ name: 'Size', values: ['S', 'M'] },
		{ name: 'Color', values: ['Red', 'Blue'] }
	]);
	expect(getProductVariantOptionGroups([], productVariants)).toEqual([]);
});

test('resolves a product variant from one value per option group', () => {
	expect(findProductVariantByOptionValues(productVariants, ['M', 'Blue'])).toEqual(
		productVariants[2]
	);
	expect(findProductVariantByOptionValues(productVariants, ['M', 'Red'])).toEqual(
		productVariants[1]
	);
	expect(findProductVariantByOptionValues(productVariants, ['S', 'Blue'])).toBeUndefined();
	expect(findProductVariantByOptionValues(productVariants, ['M'])).toBeUndefined();
});
