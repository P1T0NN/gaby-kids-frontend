'use node';

// LIBRARIES
import { ConvexError, v } from 'convex/values';
import { internal } from '../../_generated/api.js';

// BUILDERS
import { adminAction } from '../../builders/convexFunctionBuilders.js';

// CONFIG
import { stripe } from '../stripe.config.js';

// HELPERS
import { readStripeRefund } from '../helpers/readStripeRefund.js';

// TYPES
import type { BackendErrorData } from '../../../shared/types/types.js';

export const refundOrder = adminAction({
	rateLimit: { name: 'orders:refund' },
	args: { id: v.id('orders') },
	returns: v.null(),
	handler: async (ctx, { id }) => {
		const order = await ctx.runQuery(
			internal.tables.orders.queries.fetchOrderForRefund.fetchOrderForRefund,
			{ id }
		);
		if (order.paymentStatus === 'refunded') return null;

		const paymentIntentId = order.stripePaymentIntentId;
		const isRefundUnavailable =
			(order.paymentStatus !== 'paid' && order.paymentStatus !== 'refund_pending') ||
			!paymentIntentId;
		if (isRefundUnavailable)
			throw new ConvexError<BackendErrorData>({ code: 'ORDER_REFUND_UNAVAILABLE' });

		let refund;
		try {
			refund = await stripe.refunds.create(
				{ payment_intent: paymentIntentId, amount: order.totalInCents },
				{ idempotencyKey: `order-refund:${id}` }
			);
		} catch (error) {
			console.error('Stripe refund request failed', { orderId: id, error });
			throw new ConvexError<BackendErrorData>({ code: 'ORDER_REFUND_FAILED' });
		}

		let refundEvent;
		try {
			refundEvent = readStripeRefund('refund.created', refund, refund.created);
		} catch (error) {
			console.error('Stripe refund response was invalid', { orderId: id, error });
			throw new ConvexError<BackendErrorData>({ code: 'ORDER_REFUND_FAILED' });
		}

		const hasUnexpectedRefund =
			refundEvent.stripePaymentIntentId !== paymentIntentId ||
			refundEvent.currency.toLowerCase() !== order.currency.toLowerCase() ||
			refundEvent.amountInCents !== order.totalInCents;
		if (hasUnexpectedRefund) {
			console.error('Stripe refund response did not match the order', { orderId: id });
			throw new ConvexError<BackendErrorData>({ code: 'ORDER_REFUND_FAILED' });
		}

		const refundArgs =
			refundEvent.refundStatus === 'failed' || refundEvent.refundStatus === 'canceled'
				? refundEvent
				: { ...refundEvent, actorId: ctx.identity.subject };
		const appliedOrderId = await ctx.runMutation(
			internal.tables.orders.mutations.applyStripeRefund.applyStripeRefund,
			refundArgs
		);
		if (appliedOrderId !== id)
			throw new ConvexError<BackendErrorData>({ code: 'ORDER_REFUND_FAILED' });

		if (refundEvent.refundStatus === 'failed' || refundEvent.refundStatus === 'canceled')
			throw new ConvexError<BackendErrorData>({ code: 'ORDER_REFUND_FAILED' });

		return null;
	}
});
