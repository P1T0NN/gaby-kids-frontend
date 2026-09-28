// LIBRARIES
import { v } from 'convex/values';

// CONVEX
import { query } from '../../../_generated/server.js';

// HELPERS
import { getPagination } from '../../../helpers/getPagination.js';
import { readOrderFilters } from '../helpers/readOrderFilters.js';

// VALIDATORS
import { listPageArgs } from '../../../validators/listPageArgs.js';
import { myOrderPage } from '../validators/orderValidators.js';

// CONFIG
import { ORDER_CONFIG } from '../../../../shared/features/orders/config.js';

// TYPES
import type { Doc } from '../../../_generated/dataModel.js';
import type { OrderFilters } from '../helpers/readOrderFilters.js';

// The stored id is client-supplied and can be an arbitrary string, so it is validated leniently
// here and resolved with `normalizeId` in the handler rather than with `v.id('orders')`.
const guestOrder = v.object({ id: v.string(), receiptToken: v.string() });

function summarize(order: Doc<'orders'>) {
	return {
		_id: order._id,
		_creationTime: order._creationTime,
		code: order.code,
		currency: order.currency,
		fulfillmentMethod: order.fulfillmentMethod,
		totalInCents: order.totalInCents,
		paymentStatus: order.paymentStatus,
		fulfillmentStatus: order.fulfillmentStatus,
		cancelledAt: order.cancelledAt
	};
}

function matchesOrder(order: Doc<'orders'>, filters: OrderFilters): boolean {
	if (filters.paymentStatus && order.paymentStatus !== filters.paymentStatus) return false;
	if (filters.fulfillmentStatus && order.fulfillmentStatus !== filters.fulfillmentStatus)
		return false;
	if (filters.fulfillmentMethod && order.fulfillmentMethod !== filters.fulfillmentMethod)
		return false;
	return true;
}

export const fetchMyOrders = query({
	args: { ...listPageArgs, guestOrders: v.optional(v.array(guestOrder)) },
	returns: myOrderPage,
	handler: async (ctx, args) => {
		const filters = readOrderFilters(args.filters);
		const sortOrder = args.filters?._creationTime === 'asc' ? 'asc' : 'desc';
		const identity = await ctx.auth.getUserIdentity();

		if (identity) {
			const customerId = identity.subject;
			let orderQuery = ctx.db
				.query('orders')
				.withIndex('by_customer_id', (query) => query.eq('customerId', customerId))
				.order(sortOrder);

			const { paymentStatus, fulfillmentStatus, fulfillmentMethod } = filters;
			if (paymentStatus) {
				orderQuery = orderQuery.filter((q) => q.eq(q.field('paymentStatus'), paymentStatus));
			}
			if (fulfillmentStatus) {
				orderQuery = orderQuery.filter((q) =>
					q.eq(q.field('fulfillmentStatus'), fulfillmentStatus)
				);
			}
			if (fulfillmentMethod) {
				orderQuery = orderQuery.filter((q) =>
					q.eq(q.field('fulfillmentMethod'), fulfillmentMethod)
				);
			}

			const page = await getPagination(orderQuery, { paginationOpts: args.paginationOpts });
			const syncOrders = await ctx.db
				.query('orders')
				.withIndex('by_customer_id', (query) => query.eq('customerId', customerId))
				.order('desc')
				.take(ORDER_CONFIG.maxStoredOrders);

			return {
				...page,
				items: page.items.map(summarize),
				invalidOrderIds: [],
				syncOrders: syncOrders.map((order) => ({ id: order._id, receiptToken: order.receiptToken }))
			};
		}

		const verified: ReturnType<typeof summarize>[] = [];
		const invalidOrderIds: string[] = [];
		for (const access of [...(args.guestOrders ?? [])].slice(-ORDER_CONFIG.maxStoredOrders)) {
			const id = ctx.db.normalizeId('orders', access.id);
			const order = id ? await ctx.db.get(id) : null;

			if (!order || order.receiptToken !== access.receiptToken) {
				invalidOrderIds.push(access.id);
				continue;
			}

			if (!matchesOrder(order, filters)) continue;
			verified.push(summarize(order));
		}

		verified.sort((left, right) =>
			sortOrder === 'asc'
				? left._creationTime - right._creationTime
				: right._creationTime - left._creationTime
		);

		const offset = Number.parseInt(args.paginationOpts.cursor ?? '0', 10) || 0;
		const items = verified.slice(offset, offset + args.paginationOpts.numItems);
		const nextOffset = offset + items.length;

		return {
			items,
			nextCursor: nextOffset < verified.length ? String(nextOffset) : null,
			hasNextPage: nextOffset < verified.length,
			pageSize: args.paginationOpts.numItems,
			invalidOrderIds,
			syncOrders: []
		};
	}
});
