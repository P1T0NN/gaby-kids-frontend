import { expect, test } from 'vitest';
import { calculateOrderTotalInCents } from '../src/shared/utils/pricing.js';
import { hasInvalidOrderItems } from '../src/shared/features/orders/utils/hasInvalidOrderItems.js';
import { hasInvalidOrderTotals } from '../src/shared/features/orders/utils/hasInvalidOrderTotals.js';
import { calculateShippingInCents } from '../src/shared/features/orders/utils/calculateShippingInCents.js';
import { getFreeShippingRemainingInCents } from '../src/shared/features/orders/utils/getFreeShippingRemainingInCents.js';
import { ORDER_CONFIG } from '../src/shared/features/orders/config.js';

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
	expect(
		hasInvalidOrderTotals(total, {
			subtotalInCents: total,
			shippingInCents: ORDER_CONFIG.shippingFeeInCents,
			totalInCents: total + ORDER_CONFIG.shippingFeeInCents
		})
	).toBe(false);
});

test('delivery pays the flat fee until the free-shipping threshold, pickup never does', () => {
	const threshold = ORDER_CONFIG.freeShippingThresholdInCents;
	const fee = ORDER_CONFIG.shippingFeeInCents;

	expect(calculateShippingInCents(threshold - 1, 'delivery')).toBe(fee);
	expect(calculateShippingInCents(threshold, 'delivery')).toBe(0);
	expect(calculateShippingInCents(threshold + fee, 'delivery')).toBe(0);
	expect(calculateShippingInCents(1, 'pickup')).toBe(0);
	expect(calculateShippingInCents(threshold * 2, 'pickup')).toBe(0);
});

test('the free-shipping nudge reports the exact remaining amount', () => {
	const threshold = ORDER_CONFIG.freeShippingThresholdInCents;

	expect(getFreeShippingRemainingInCents(0)).toBe(threshold);
	expect(getFreeShippingRemainingInCents(threshold - 1)).toBe(1);
	expect(getFreeShippingRemainingInCents(threshold)).toBe(0);
	expect(getFreeShippingRemainingInCents(threshold + 1)).toBe(0);
});
