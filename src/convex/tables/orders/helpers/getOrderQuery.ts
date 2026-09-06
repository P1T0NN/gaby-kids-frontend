// UTILS
import { isFulfillmentMethod } from '../../../../shared/features/orders/utils/isFulfillmentMethod.js';
import { isFulfillmentStatus } from '../../../../shared/features/orders/utils/isFulfillmentStatus.js';
import { isPaymentStatus } from '../../../../shared/features/orders/utils/isPaymentStatus.js';

// TYPES
import type { Doc } from '../../../_generated/dataModel.js';
import type { QueryCtx } from '../../../_generated/server.js';
import type { ConvexFilter } from '../../../../shared/features/filters/types/filterTypesConvex.js';
import type { ConvexPaginatedSource } from '../../../../shared/features/pagination/types/paginationTypesConvex.js';

type Order = Doc<'orders'>;

export function getOrderQuery(
	ctx: QueryCtx,
	filters: ConvexFilter[]
): ConvexPaginatedSource<Order> {
	const paymentStatus = filters.find((filter) => filter.field === 'paymentStatus')?.eq;
	const fulfillmentStatus = filters.find((filter) => filter.field === 'fulfillmentStatus')?.eq;
	const fulfillmentMethod = filters.find((filter) => filter.field === 'fulfillmentMethod')?.eq;
	const method = isFulfillmentMethod(fulfillmentMethod) ? fulfillmentMethod : undefined;

	if (isPaymentStatus(paymentStatus) && isFulfillmentStatus(fulfillmentStatus) && method) {
		return ctx.db
			.query('orders')
			.withIndex('by_payment_status_and_fulfillment_status_and_fulfillment_method', (query) =>
				query
					.eq('paymentStatus', paymentStatus)
					.eq('fulfillmentStatus', fulfillmentStatus)
					.eq('fulfillmentMethod', method)
			)
			.order('desc');
	}

	if (isPaymentStatus(paymentStatus) && isFulfillmentStatus(fulfillmentStatus)) {
		return ctx.db
			.query('orders')
			.withIndex('by_payment_status_and_fulfillment_status', (query) =>
				query.eq('paymentStatus', paymentStatus).eq('fulfillmentStatus', fulfillmentStatus)
			)
			.order('desc');
	}

	if (isPaymentStatus(paymentStatus) && method) {
		return ctx.db
			.query('orders')
			.withIndex('by_payment_status_and_fulfillment_method', (query) =>
				query.eq('paymentStatus', paymentStatus).eq('fulfillmentMethod', method)
			)
			.order('desc');
	}

	if (isFulfillmentStatus(fulfillmentStatus) && method) {
		return ctx.db
			.query('orders')
			.withIndex('by_fulfillment_status_and_fulfillment_method', (query) =>
				query.eq('fulfillmentStatus', fulfillmentStatus).eq('fulfillmentMethod', method)
			)
			.order('desc');
	}

	if (isPaymentStatus(paymentStatus)) {
		return ctx.db
			.query('orders')
			.withIndex('by_payment_status', (query) => query.eq('paymentStatus', paymentStatus))
			.order('desc');
	}

	if (isFulfillmentStatus(fulfillmentStatus)) {
		return ctx.db
			.query('orders')
			.withIndex('by_fulfillment_status', (query) =>
				query.eq('fulfillmentStatus', fulfillmentStatus)
			)
			.order('desc');
	}

	if (method) {
		return ctx.db
			.query('orders')
			.withIndex('by_fulfillment_method', (query) => query.eq('fulfillmentMethod', method))
			.order('desc');
	}

	return ctx.db.query('orders').withIndex('by_creation_time').order('desc');
}
