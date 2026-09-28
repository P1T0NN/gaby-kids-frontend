// TYPES
import type { Doc } from '../../../_generated/dataModel.js';
import type { QueryCtx } from '../../../_generated/server.js';
import type { ConvexPaginatedSource } from '../../../../shared/features/pagination/types/paginationTypesConvex.js';
import type { OrderFilters } from './readOrderFilters.js';

type Order = Doc<'orders'>;

/** Pick the most specific orders index for the active filters. */
export function getOrderQuery(ctx: QueryCtx, filters: OrderFilters): ConvexPaginatedSource<Order> {
	const { paymentStatus, fulfillmentStatus, fulfillmentMethod } = filters;

	if (paymentStatus && fulfillmentStatus && fulfillmentMethod) {
		return ctx.db
			.query('orders')
			.withIndex('by_payment_status_and_fulfillment_status_and_fulfillment_method', (query) =>
				query
					.eq('paymentStatus', paymentStatus)
					.eq('fulfillmentStatus', fulfillmentStatus)
					.eq('fulfillmentMethod', fulfillmentMethod)
			)
			.order('desc');
	}

	if (paymentStatus && fulfillmentStatus) {
		return ctx.db
			.query('orders')
			.withIndex('by_payment_status_and_fulfillment_status', (query) =>
				query.eq('paymentStatus', paymentStatus).eq('fulfillmentStatus', fulfillmentStatus)
			)
			.order('desc');
	}

	if (paymentStatus && fulfillmentMethod) {
		return ctx.db
			.query('orders')
			.withIndex('by_payment_status_and_fulfillment_method', (query) =>
				query.eq('paymentStatus', paymentStatus).eq('fulfillmentMethod', fulfillmentMethod)
			)
			.order('desc');
	}

	if (fulfillmentStatus && fulfillmentMethod) {
		return ctx.db
			.query('orders')
			.withIndex('by_fulfillment_status_and_fulfillment_method', (query) =>
				query.eq('fulfillmentStatus', fulfillmentStatus).eq('fulfillmentMethod', fulfillmentMethod)
			)
			.order('desc');
	}

	if (paymentStatus) {
		return ctx.db
			.query('orders')
			.withIndex('by_payment_status', (query) => query.eq('paymentStatus', paymentStatus))
			.order('desc');
	}

	if (fulfillmentStatus) {
		return ctx.db
			.query('orders')
			.withIndex('by_fulfillment_status', (query) =>
				query.eq('fulfillmentStatus', fulfillmentStatus)
			)
			.order('desc');
	}

	if (fulfillmentMethod) {
		return ctx.db
			.query('orders')
			.withIndex('by_fulfillment_method', (query) =>
				query.eq('fulfillmentMethod', fulfillmentMethod)
			)
			.order('desc');
	}

	return ctx.db.query('orders').withIndex('by_creation_time').order('desc');
}
