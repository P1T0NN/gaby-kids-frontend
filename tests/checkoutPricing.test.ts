import { expect, test } from 'vitest';
import { calculateOrderTotalInCents } from '../src/shared/features/orders/utils/calculateOrders.js';
import { hasInvalidOrderItems } from '../src/shared/features/orders/utils/hasInvalidOrderItems.js';
import { hasInvalidOrderTotals } from '../src/shared/features/orders/utils/hasInvalidOrderTotals.js';

test('checkout totals stay in cents and include every quantity', () => {
	const items = [
		{ unitPriceInCents: 1299, quantity: 2 },
		{ unitPriceInCents: 450, quantity: 3 }
	];
	const total = calculateOrderTotalInCents(items);

	expect(total).toBe(3948);
	expect(calculateOrderTotalInCents([])).toBe(0);
	expect(hasInvalidOrderItems(items)).toBe(false);
	expect(hasInvalidOrderItems([])).toBe(true);
	expect(hasInvalidOrderTotals(total, { subtotalInCents: total, totalInCents: total })).toBe(false);
	expect(hasInvalidOrderTotals(total, { subtotalInCents: total, totalInCents: 999 })).toBe(true);
});
