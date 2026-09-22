import { expect, test } from 'vitest';
import { getDiscountPercent } from '../src/shared/utils/pricing.js';

test('calculates display discounts from integer cents', () => {
	expect(getDiscountPercent(5999, 9999)).toBe(40);
	expect(getDiscountPercent(9999, 9999)).toBeNull();
	expect(getDiscountPercent(9999, 5999)).toBeNull();
});
