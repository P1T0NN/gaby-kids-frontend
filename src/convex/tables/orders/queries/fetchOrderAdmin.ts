// LIBRARIES
import { ConvexError, v } from 'convex/values';

// BUILDERS
import { adminQuery } from '../../../builders/convexFunctionBuilders.js';

// VALIDATORS
import { orderDetailResult } from '../validators/orderValidators.js';

// CONFIG
import { ORDER_CONFIG } from '../../../../shared/features/orders/config.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

export const fetchOrderAdmin = adminQuery({
	args: { id: v.id('orders') },
	returns: orderDetailResult,
	handler: async (ctx, args) => {
		const order = await ctx.db.get(args.id);
		if (!order) throw new ConvexError<BackendErrorData>({ code: 'ORDER_NOT_FOUND' });
		const items = await ctx.db
			.query('orderItems')
			.withIndex('by_order_id', (query) => query.eq('orderId', args.id))
			.take(ORDER_CONFIG.maxLines);
		return { order, items };
	}
});
