// DATA
import { ORDER_FILTER_VALUES } from '../data/ordersData.js';

// TYPES
import type { ConvexFilter } from '../../filters/types/filterTypesConvex.js';

// UTILS
import { isOrderFilterField } from './isOrderFilterField.js';

export function buildOrderFilter(key: string, value: string): ConvexFilter | undefined {
	if (!isOrderFilterField(key)) return undefined;
	return ORDER_FILTER_VALUES[key].some((candidate) => candidate === value)
		? { field: key, eq: value }
		: undefined;
}
