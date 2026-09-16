import { describe, expect, it } from 'vitest';

import { calculateDiscountedPriceInCents, priceInCents } from '../src/shared/utils/pricing.js';

describe('priceInCents', () => {
	it('converts a currency input to integer cents', () => {
		expect(priceInCents('19.99')).toBe(1999);
	});
});

describe('calculateDiscountedPriceInCents', () => {
	it('calculates cent-safe discounts and rejects unsupported percentages', () => {
		expect(calculateDiscountedPriceInCents(1999, 15)).toBe(1699);
		expect(calculateDiscountedPriceInCents(1999, 7)).toBeNull();
		expect(calculateDiscountedPriceInCents(1999, 100)).toBeNull();
	});
});
