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

// The unguessable receipt token grants guest access to this order.
export const fetchOrderReceipt = query({
	args: { receiptToken: v.string() },
	returns: v.union(customerOrderDetailResult, v.null()),
	handler: async (ctx, args) => {
		const order = await ctx.db
			.query('orders')
			.withIndex('by_receiptToken', (query) => query.eq('receiptToken', args.receiptToken))
			.unique();
		if (!order) return null;

		const items = await ctx.db
			.query('orderItems')
			.withIndex('by_order_id', (query) => query.eq('orderId', order._id))
			.take(ORDER_CONFIG.maxLines);

		return { order: toCustomerOrder(order), items };
	}
});
