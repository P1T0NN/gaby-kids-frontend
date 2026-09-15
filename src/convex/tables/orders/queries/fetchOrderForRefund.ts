// LIBRARIES
import { ConvexError, v } from 'convex/values';

// CONVEX
import { internalQuery } from '../../../_generated/server.js';

// VALIDATORS
import { refundOrderResult } from '../validators/orderValidators.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

export const fetchOrderForRefund = internalQuery({
	args: { id: v.id('orders') },
	returns: refundOrderResult,
	handler: async (ctx, args) => {
		const order = await ctx.db.get(args.id);
		if (!order) throw new ConvexError<BackendErrorData>({ code: 'ORDER_NOT_FOUND' });

		return {
			_id: order._id,
			_creationTime: order._creationTime,
			currency: order.currency,
			totalInCents: order.totalInCents,
			paymentStatus: order.paymentStatus,
			stripePaymentIntentId: order.stripePaymentIntentId
		};
	}
});
