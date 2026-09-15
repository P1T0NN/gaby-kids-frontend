// CONFIG
import { ORDER_CONFIG } from '../config.js';

// TYPES
import type { OrderCalculationItem } from './calculateOrders.js';

export function hasInvalidOrderItems(items: readonly OrderCalculationItem[]): boolean {
	return (
		items.length === 0 ||
		items.length > ORDER_CONFIG.maxLines ||
		items.some(
			(item) =>
				!Number.isSafeInteger(item.unitPriceInCents) ||
				item.unitPriceInCents < 0 ||
				!Number.isSafeInteger(item.quantity) ||
				item.quantity < 1
		)
	);
}
