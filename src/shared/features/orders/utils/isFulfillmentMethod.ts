// DATA
import { ORDER_FILTER_VALUES } from '../data/ordersData.js';

// TYPES
import type { Doc } from '../../../../convex/_generated/dataModel.js';

type Order = Doc<'orders'>;

export function isFulfillmentMethod(
	value: string | undefined
): value is Order['fulfillmentMethod'] {
	return ORDER_FILTER_VALUES.fulfillmentMethod.some((method) => method === value);
}
