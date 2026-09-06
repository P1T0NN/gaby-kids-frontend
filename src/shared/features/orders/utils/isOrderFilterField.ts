// DATA
import { ORDER_FILTER_VALUES } from '../data/ordersData.js';

// TYPES
import type { OrderFilterField } from '../data/ordersData.js';

export function isOrderFilterField(key: string): key is OrderFilterField {
	return Object.hasOwn(ORDER_FILTER_VALUES, key);
}
