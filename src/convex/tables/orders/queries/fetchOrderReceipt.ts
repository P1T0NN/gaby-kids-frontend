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

// The client passes the idempotency `retryKey` it minted at checkout as an
// unguessable receipt token. Possessing the key proves the caller is the one who
// created the order, so it is never treated as authorization input beyond that.
export const fetchOrderReceipt = query({
	args: { retryKey: v.string() },
	returns: v.union(customerOrderDetailResult, v.null()),
	handler: async (ctx, args) => {
		const order = await ctx.db
			.query('orders')
			.withIndex('by_retry_key', (query) => query.eq('retryKey', args.retryKey))
			.unique();
		if (!order) return null;

		const items = await ctx.db
			.query('orderItems')
			.withIndex('by_order_id', (query) => query.eq('orderId', order._id))
			.take(ORDER_CONFIG.maxLines);

		return { order: toCustomerOrder(order), items };
	}
});
