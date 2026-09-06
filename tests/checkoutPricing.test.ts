import { expect, test } from 'vitest';
import { calculateCartTotal } from '../src/shared/features/cart/utils/calculateCartTotal.js';

test('checkout totals stay in cents and include every quantity', () => {
	expect(
		calculateCartTotal([
			{ price: 1299, discount: 0, quantity: 2 },
			{ price: 450, discount: 0, quantity: 3 }
		])
	).toBe(3948);
	expect(calculateCartTotal([])).toBe(0);
});
