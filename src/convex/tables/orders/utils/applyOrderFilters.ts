// TYPES
import type { ConvexFilter } from '../../../../shared/features/filters/types/filterTypesConvex.js';
import type { OrderQuery } from '../../../../shared/features/orders/types/ordersTypes.js';
import type { Doc } from '../../../_generated/dataModel.js';

/**
 * Append the validated order filters as `.filter()` predicates on a query already scoped by
 * `customerId`. The status/method predicates are not part of the `by_customer_id` index, so they
 * filter after the (already narrow) customer scan.
 */
export function applyOrderFilters(query: OrderQuery, filters: ConvexFilter[]): OrderQuery {
	for (const filter of filters) {
		const value = filter.eq;
		if (value === undefined) continue;

		if (filter.field === 'paymentStatus') {
			// SAFETY: buildOrderFilter only emits payment-status values from ORDER_FILTER_VALUES.
			query = query.filter((q) =>
				q.eq(q.field('paymentStatus'), value as Doc<'orders'>['paymentStatus'])
			);
		} else if (filter.field === 'fulfillmentStatus') {
			// SAFETY: buildOrderFilter only emits fulfillment-status values from ORDER_FILTER_VALUES.
			query = query.filter((q) =>
				q.eq(q.field('fulfillmentStatus'), value as Doc<'orders'>['fulfillmentStatus'])
			);
		} else if (filter.field === 'fulfillmentMethod') {
			// SAFETY: buildOrderFilter only emits fulfillment-method values from ORDER_FILTER_VALUES.
			query = query.filter((q) =>
				q.eq(q.field('fulfillmentMethod'), value as Doc<'orders'>['fulfillmentMethod'])
			);
		}
	}
	return query;
}
