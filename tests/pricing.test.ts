import { describe, expect, it } from 'vitest';

import {
	calculateDiscountedPriceInCents,
	formatAmountInput,
	parseAmountInput,
	sanitizeAmountInput
} from '../src/shared/utils/pricing.js';

describe('formatAmountInput', () => {
	it('formats minor units with the given decimals and blanks absent values', () => {
		expect(formatAmountInput(1999, 2)).toBe('19.99');
		expect(formatAmountInput(1000, 2)).toBe('10.00');
		expect(formatAmountInput(5, 0)).toBe('5');
		expect(formatAmountInput(undefined, 2)).toBe('');
	});
});

describe('sanitizeAmountInput', () => {
	it('keeps at most the allowed decimal places', () => {
		expect(sanitizeAmountInput('19.999', 2)).toBe('19.99');
		expect(sanitizeAmountInput('19,99', 2)).toBe('19.99');
		expect(sanitizeAmountInput('abc12.3', 2)).toBe('12.3');
		expect(sanitizeAmountInput('12.5', 0)).toBe('12');
	});
});

describe('parseAmountInput', () => {
	it('parses editable amounts into integer minor units', () => {
		expect(parseAmountInput('19.99', 2)).toBe(1999);
		expect(parseAmountInput('19.', 2)).toBe(1900);
		expect(parseAmountInput('', 2)).toBeUndefined();
		expect(parseAmountInput('.', 2)).toBeUndefined();
	});
});

describe('calculateDiscountedPriceInCents', () => {
	it('calculates cent-safe discounts and rejects unsupported percentages', () => {
		expect(calculateDiscountedPriceInCents(1999, 15)).toBe(1699);
		expect(calculateDiscountedPriceInCents(1999, 7)).toBeNull();
		expect(calculateDiscountedPriceInCents(1999, 100)).toBeNull();
	});
});
