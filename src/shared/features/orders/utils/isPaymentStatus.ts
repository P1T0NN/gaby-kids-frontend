// DATA
import { ORDER_FILTER_VALUES } from '../data/ordersData.js';

// TYPES
import type { ConvexFilter } from '../../filters/types/filterTypesConvex.js';
import type { Doc } from '../../../../convex/_generated/dataModel.js';

type Order = Doc<'orders'>;

export function isPaymentStatus(value: ConvexFilter['eq']): value is Order['paymentStatus'] {
	return ORDER_FILTER_VALUES.paymentStatus.some((status) => status === value);
}
