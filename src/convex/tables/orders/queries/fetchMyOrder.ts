// LIBRARIES
import { v } from 'convex/values';

// CONVEX
import { query } from '../../../_generated/server.js';

// CONFIG
import { ORDER_CONFIG } from '../../../../shared/features/orders/config.js';

// VALIDATORS
import { customerOrderDetailResult } from '../validators/orderValidators.js';

// HELPERS
import { toCustomerOrder } from '../helpers/toCustomerOrder.js';

export const fetchMyOrder = query({
	args: {
		code: v.string(),
		// The stored id is client-supplied and can be an arbitrary string, so it is validated
		// leniently here and resolved with `normalizeId` in the handler.
		guestOrders: v.optional(v.array(v.object({ id: v.string(), retryKey: v.string() })))
	},
	returns: v.union(customerOrderDetailResult, v.null()),
	handler: async (ctx, args) => {
		const order = await ctx.db
			.query('orders')
			.withIndex('by_code', (query) => query.eq('code', args.code.toUpperCase()))
			.unique();
		if (!order?.code) return null;

		const identity = await ctx.auth.getUserIdentity();
		const ownsOrder = identity?.subject === order.customerId;
		const hasGuestAccess = args.guestOrders?.some((access) => {
			const id = ctx.db.normalizeId('orders', access.id);
			return id !== null && id === order._id && access.retryKey === order.retryKey;
		});
		if (!ownsOrder && !hasGuestAccess) return null;

		const items = await ctx.db
			.query('orderItems')
			.withIndex('by_order_id', (query) => query.eq('orderId', order._id))
			.take(ORDER_CONFIG.maxLines);
		return { order: toCustomerOrder(order), items };
	}
});
