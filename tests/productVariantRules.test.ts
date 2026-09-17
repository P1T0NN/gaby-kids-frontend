import { expect, test } from 'vitest';
import { getProductVariantOptionKey } from '../src/shared/features/productVariants/utils/getProductVariantOptionKey.js';
import { hasValidProductVariantDiscount } from '../src/shared/features/productVariants/utils/hasValidProductVariantDiscount.js';

test('builds a canonical, case-insensitive product variant option key', () => {
	expect(
		getProductVariantOptionKey([
			{ name: 'Color', value: 'Red' },
			{ name: 'Size', value: 'M' }
		])
	).toBe('color:red|size:m');
	expect(
		getProductVariantOptionKey([
			{ name: ' color ', value: ' red ' },
			{ name: 'SIZE', value: 'm' }
		])
	).toBe('color:red|size:m');
	expect(getProductVariantOptionKey([])).toBe('');
});

test('validates product variant discounts', () => {
	expect(hasValidProductVariantDiscount(undefined, 1000)).toBe(true);
	expect(hasValidProductVariantDiscount(1000, 800)).toBe(true);
	expect(hasValidProductVariantDiscount(1000, 1000)).toBe(false);
	expect(hasValidProductVariantDiscount(1000, 1200)).toBe(false);
});
