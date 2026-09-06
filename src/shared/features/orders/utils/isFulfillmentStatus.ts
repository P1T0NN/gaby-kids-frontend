// DATA
import { ORDER_FILTER_VALUES } from '../data/ordersData.js';

// TYPES
import type { ConvexFilter } from '../../filters/types/filterTypesConvex.js';
import type { Doc } from '../../../../convex/_generated/dataModel.js';

type Order = Doc<'orders'>;

export function isFulfillmentStatus(
	value: ConvexFilter['eq']
): value is Order['fulfillmentStatus'] {
	return ORDER_FILTER_VALUES.fulfillmentStatus.some((status) => status === value);
}
