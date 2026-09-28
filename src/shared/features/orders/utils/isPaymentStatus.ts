// DATA
import { ORDER_FILTER_VALUES } from '../data/ordersData.js';

// TYPES
import type { Doc } from '../../../../convex/_generated/dataModel.js';

type Order = Doc<'orders'>;

export function isPaymentStatus(value: string | undefined): value is Order['paymentStatus'] {
	return ORDER_FILTER_VALUES.paymentStatus.some((status) => status === value);
}
