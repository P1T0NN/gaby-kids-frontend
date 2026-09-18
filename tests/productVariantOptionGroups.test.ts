import { expect, test } from 'vitest';
import { findProductVariantByOptionValues } from '../src/features/productVariants/utils/findProductVariantByOptionValues.js';
import { getProductVariantOptionGroups } from '../src/features/productVariants/utils/getProductVariantOptionGroups.js';

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

test('groups unique option values per product option without duplicates', () => {
	expect(getProductVariantOptionGroups(['Size', 'Color'], productVariants)).toEqual([
		{ name: 'Size', values: ['S', 'M'] },
		{ name: 'Color', values: ['Red', 'Blue'] }
	]);
	expect(getProductVariantOptionGroups([], productVariants)).toEqual([]);
});

test('orders known sizes and numbers naturally while keeping other values in product variant order', () => {
	const mixedVariants = [
		{
			options: [
				{ name: 'Size', value: 'L' },
				{ name: 'Length', value: '40' },
				{ name: 'Color', value: 'Zebra' }
			]
		},
		{
			options: [
				{ name: 'Size', value: 'M' },
				{ name: 'Length', value: '38' },
				{ name: 'Color', value: 'Aqua' }
			]
		},
		{
			options: [
				{ name: 'Size', value: 'XL' },
				{ name: 'Length', value: '40' },
				{ name: 'Color', value: 'Zebra' }
			]
		}
	];

	expect(getProductVariantOptionGroups(['Size', 'Length', 'Color'], mixedVariants)).toEqual([
		{ name: 'Size', values: ['M', 'L', 'XL'] },
		{ name: 'Length', values: ['38', '40'] },
		{ name: 'Color', values: ['Zebra', 'Aqua'] }
	]);
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
