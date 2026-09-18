import { expect, test } from 'vitest';
import { resolveProductVariantOptionValue } from '../src/features/productVariants/utils/resolveProductVariantOptionValue.js';

function variant(options: [string, string][], inventory = 5, reservedInventory = 0) {
	return {
		options: options.map(([name, value]) => ({ name, value })),
		inventory,
		reservedInventory
	};
}

const colorSizeVariants = [
	variant([
		['Color', 'Red'],
		['Size', 'L']
	]),
	variant([
		['Color', 'Black'],
		['Size', 'L']
	]),
	variant([
		['Color', 'Gray'],
		['Size', 'M']
	])
];

test('picks the exact product variant when the combination exists and is available', () => {
	expect(
		resolveProductVariantOptionValue(1, 'L', {
			productVariants: colorSizeVariants,
			selectedOptionValues: ['Red', 'L'],
			trackInventory: true
		})
	).toEqual({ productVariant: colorSizeVariants[0], unavailableReason: undefined });
});

test('lands on an available variant of the clicked value when the combination is missing', () => {
	expect(
		resolveProductVariantOptionValue(0, 'Gray', {
			productVariants: colorSizeVariants,
			selectedOptionValues: ['Red', 'L'],
			trackInventory: true
		})
	).toEqual({ productVariant: colorSizeVariants[2], unavailableReason: undefined });
});

test('marks a value that does not exist for the selected option as incompatible', () => {
	const resolution = resolveProductVariantOptionValue(1, 'M', {
		productVariants: colorSizeVariants,
		selectedOptionValues: ['Red', 'L'],
		trackInventory: true
	});
	expect(resolution.productVariant).toEqual(colorSizeVariants[2]);
	expect(resolution.unavailableReason).toBe('incompatible');
});

test('reports sold out and reserved stock reasons', () => {
	const soldOut = [
		variant(
			[
				['Color', 'Red'],
				['Size', 'L']
			],
			0
		)
	];
	expect(
		resolveProductVariantOptionValue(1, 'L', {
			productVariants: soldOut,
			selectedOptionValues: ['Red', 'L'],
			trackInventory: true
		}).unavailableReason
	).toBe('sold_out');

	const reserved = [
		variant(
			[
				['Color', 'Red'],
				['Size', 'L']
			],
			2,
			2
		)
	];
	expect(
		resolveProductVariantOptionValue(1, 'L', {
			productVariants: reserved,
			selectedOptionValues: ['Red', 'L'],
			trackInventory: true
		}).unavailableReason
	).toBe('temporarily_unavailable');
});

test('prefers the available candidate that keeps the most of the current selection', () => {
	const variants = [
		variant([
			['Color', 'Red'],
			['Size', 'L'],
			['Material', 'Cotton']
		]),
		variant([
			['Color', 'Red'],
			['Size', 'M'],
			['Material', 'Wool']
		]),
		variant([
			['Color', 'Black'],
			['Size', 'M'],
			['Material', 'Wool']
		])
	];
	const resolution = resolveProductVariantOptionValue(1, 'M', {
		productVariants: variants,
		selectedOptionValues: ['Red', 'L', 'Cotton'],
		trackInventory: true
	});
	expect(resolution.productVariant).toEqual(variants[1]);
	expect(resolution.unavailableReason).toBeUndefined();
});

test('keeps a sold-out exact combination instead of switching a value the customer chose', () => {
	const variants = [
		variant([
			['Color', 'Red'],
			['Size', 'L']
		]),
		variant([
			['Color', 'Gray'],
			['Size', 'M']
		]),
		variant(
			[
				['Color', 'Red'],
				['Size', 'M']
			],
			0
		)
	];
	const resolution = resolveProductVariantOptionValue(1, 'M', {
		productVariants: variants,
		selectedOptionValues: ['Red', 'L'],
		trackInventory: true
	});
	expect(resolution.productVariant).toEqual(variants[2]);
	expect(resolution.unavailableReason).toBe('sold_out');
});

test('lets the primary option adjust dependent values past a sold-out combination', () => {
	const variants = [
		variant([
			['Color', 'Red'],
			['Size', 'L']
		]),
		variant([
			['Color', 'Gray'],
			['Size', 'M']
		]),
		variant(
			[
				['Color', 'Red'],
				['Size', 'M']
			],
			0
		)
	];
	const resolution = resolveProductVariantOptionValue(0, 'Red', {
		productVariants: variants,
		selectedOptionValues: ['Gray', 'M'],
		trackInventory: true
	});
	expect(resolution.productVariant).toEqual(variants[0]);
	expect(resolution.unavailableReason).toBeUndefined();
});

test('treats every variant as available when inventory is not tracked', () => {
	expect(
		resolveProductVariantOptionValue(1, 'L', {
			productVariants: [
				variant(
					[
						['Color', 'Red'],
						['Size', 'L']
					],
					0
				)
			],
			selectedOptionValues: ['Red', 'L'],
			trackInventory: false
		}).unavailableReason
	).toBeUndefined();
});
