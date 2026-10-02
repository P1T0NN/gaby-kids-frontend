import { expect, test } from 'vitest';
import {
	buildProductOptionKeys,
	buildProductOptionSelectionKey,
	parseProductOptionKey
} from '../src/convex/tables/productOptionIndex/utils/buildProductOptionKeys.js';
import { normalizeProductOptionText } from '../src/shared/features/productVariants/utils/normalizeProductOptionText.js';

test('normalizes product option text before comparison', () => {
	expect(normalizeProductOptionText('  Re\u0301d  ')).toBe('réd');
	expect(normalizeProductOptionText('  Red   Blue  ')).toBe('red blue');
	expect(normalizeProductOptionText('')).toBe('');
});

test('builds one selection key per non-empty subset of a configured pair', () => {
	expect(
		buildProductOptionKeys([
			{
				options: [
					{ name: 'Color', value: 'Rojo' },
					{ name: 'Tallas', value: '5' }
				]
			}
		])
	).toEqual(['color:rojo', 'color:rojo|tallas:5', 'tallas:5']);
});

test('deduplicates keys, normalizes names and values, and ignores unconfigured options', () => {
	const keys = buildProductOptionKeys([
		{
			options: [
				{ name: 'Color', value: 'Rojo' },
				{ name: 'Material', value: 'Cotton' }
			]
		},
		{
			options: [
				{ name: ' color ', value: ' rojo ' },
				{ name: 'Tallas', value: '4' }
			]
		},
		{ options: [{ name: 'Tallas', value: '4' }] }
	]);

	expect(keys).toEqual(['color:rojo', 'color:rojo|tallas:4', 'tallas:4']);
});

test('builds and parses canonical selection keys', () => {
	expect(
		buildProductOptionSelectionKey([
			{ optionName: 'size', optionValue: 'l' },
			{ optionName: 'color', optionValue: 'red' }
		])
	).toBe('color:red|size:l');
	expect(parseProductOptionKey('color:red|size:l')).toEqual([
		{ optionName: 'color', optionValue: 'red' },
		{ optionName: 'size', optionValue: 'l' }
	]);
});
