import { describe, expect, it } from 'vitest';

import { hasInvalidCustomPercent } from '../src/shared/features/products/utils/hasInvalidCustomPercent.js';

describe('hasInvalidCustomPercent', () => {
	it('allows an empty value or multiples of five from 5 to 95', () => {
		expect(hasInvalidCustomPercent('', 0)).toBe(false);
		expect(hasInvalidCustomPercent('15', 15)).toBe(false);
		expect(hasInvalidCustomPercent('7', 7)).toBe(true);
		expect(hasInvalidCustomPercent('100', 100)).toBe(true);
	});
});
