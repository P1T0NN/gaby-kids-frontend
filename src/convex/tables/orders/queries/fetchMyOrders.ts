// LIBRARIES
import { v } from 'convex/values';

// WRAPPERS
import { fetchOptimizedQuery } from '../../../wrappers/fetchOptimizedQuery.js';

// HELPERS
import { getPagination } from '../../../helpers/getPagination.js';
import { applyOrderFilters } from '../utils/applyOrderFilters.js';

// VALIDATORS
import { myOrderPage } from '../validators/orderValidators.js';

// CONFIG
import { ORDER_CONFIG } from '../../../../shared/features/orders/config.js';

// FILTERS
import { buildOrderFilter } from '../../../../shared/features/orders/utils/buildOrderFilter.js';

// TYPES
import type { ConvexFilter } from '../../../../shared/features/filters/types/filterTypesConvex.js';
import type { ConvexPaginatedPage } from '../../../../shared/features/pagination/types/paginationTypesConvex.js';
import type { Doc, Id } from '../../../_generated/dataModel.js';

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

function matchesOrder(order: Doc<'orders'>, filters: ConvexFilter[]): boolean {
	for (const filter of filters) {
		const value = filter.eq;
		if (value === undefined) continue;
		if (filter.field === 'paymentStatus' && order.paymentStatus !== value) return false;
		if (filter.field === 'fulfillmentStatus' && order.fulfillmentStatus !== value) return false;
		if (filter.field === 'fulfillmentMethod' && order.fulfillmentMethod !== value) return false;
	}
	return true;
}

type MyOrderItem = NonNullable<ReturnType<typeof summarize>>;
type MyOrdersPage = ConvexPaginatedPage<MyOrderItem> & {
	invalidOrderIds: string[];
	syncOrders: { id: Id<'orders'>; receiptToken: string }[];
};

export const fetchMyOrders = fetchOptimizedQuery({
	args: { guestOrders: v.optional(v.array(guestOrder)) },
	returns: myOrderPage,
	predicateFor: buildOrderFilter,
	fetchPage: async ({ ctx, args, paginationOpts, filters }) => {
		const sortOrder = args.filters?._creationTime === 'asc' ? 'asc' : 'desc';
		const identity = await ctx.auth.getUserIdentity();
		if (identity) {
			const orderQuery = applyOrderFilters(
				ctx.db
					.query('orders')
					.withIndex('by_customer_id', (query) => query.eq('customerId', identity.subject))
					.order(sortOrder),
				filters
			);
			const page = await getPagination(orderQuery, { paginationOpts });
			const syncOrders = await ctx.db
				.query('orders')
				.withIndex('by_customer_id', (query) => query.eq('customerId', identity.subject))
				.order('desc')
				.take(ORDER_CONFIG.maxStoredOrders);
			const result: MyOrdersPage = {
				...page,
				items: page.items.map(summarize).filter((order) => order !== null),
				invalidOrderIds: [],
				syncOrders: syncOrders.map((order) => ({ id: order._id, receiptToken: order.receiptToken }))
			};
			return result;
		}

		const verified: MyOrderItem[] = [];
		const invalidOrderIds: string[] = [];
		for (const access of [...(args.guestOrders ?? [])].slice(-ORDER_CONFIG.maxStoredOrders)) {
			const id = ctx.db.normalizeId('orders', access.id);
			const order = id ? await ctx.db.get(id) : null;

			if (!order || order.receiptToken !== access.receiptToken) {
				invalidOrderIds.push(access.id);
				continue;
			}

			if (!matchesOrder(order, filters)) continue;

			const summary = summarize(order);

			if (summary) verified.push(summary);
		}

		verified.sort((left, right) =>
			sortOrder === 'asc'
				? left._creationTime - right._creationTime
				: right._creationTime - left._creationTime
		);

		const offset = Number.parseInt(paginationOpts.cursor ?? '0', 10) || 0;
		const items = verified.slice(offset, offset + paginationOpts.numItems);
		const nextOffset = offset + items.length;

		const result: MyOrdersPage = {
			items,
			nextCursor: nextOffset < verified.length ? String(nextOffset) : null,
			hasNextPage: nextOffset < verified.length,
			pageSize: paginationOpts.numItems,
			total: verified.length,
			invalidOrderIds,
			syncOrders: []
		};
		return result;
	}
});
