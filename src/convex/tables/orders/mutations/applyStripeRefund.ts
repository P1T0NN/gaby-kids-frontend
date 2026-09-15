// LIBRARIES
import { AuditActions } from 'convex-audit-log';
import { v } from 'convex/values';

// BUILDERS
import { internalMutation } from '../../../builders/convexFunctionBuilders.js';

// HELPERS
import { logAuditEvent } from '../../../auditLogs/helpers/logAuditEvent.js';

// VALIDATORS
import { stripeRefundEventArgs } from '../../../stripe/validators/stripeValidators.js';

export const applyStripeRefund = internalMutation({
	args: {
		...stripeRefundEventArgs.fields,
		actorId: v.optional(v.string())
	},
	returns: v.union(v.id('orders'), v.null()),
	handler: async (ctx, args) => {
		const paymentIntentId = args.stripePaymentIntentId;
		if (!paymentIntentId) return null;

		const order = await ctx.db
			.query('orders')
			.withIndex('by_stripePaymentIntentId', (query) =>
				query.eq('stripePaymentIntentId', paymentIntentId)
			)
			.unique();
		if (!order) return null;
		if (order.paymentStatus === 'refunded') return order._id;

		const hasInvalidRefund =
			(args.eventType === 'refund.failed' && args.refundStatus !== 'failed') ||
			!args.stripeRefundId ||
			!Number.isSafeInteger(args.eventCreatedAt) ||
			args.eventCreatedAt <= 0 ||
			!Number.isSafeInteger(args.amountInCents) ||
			args.amountInCents <= 0 ||
			args.amountInCents !== order.totalInCents ||
			args.currency.toLowerCase() !== order.currency.toLowerCase();
		if (hasInvalidRefund) throw new Error('Stripe refund invariant violated.');

		let changed = false;
		if (args.refundStatus === 'succeeded') {
			if (order.paymentStatus !== 'paid' && order.paymentStatus !== 'refund_pending')
				throw new Error('Stripe refund payment state invariant violated.');

			await ctx.db.patch(order._id, {
				paymentStatus: 'refunded',
				refundedAt: args.eventCreatedAt * 1000,
				refundedAmountInCents: args.amountInCents,
				updatedAt: Date.now()
			});
			changed = true;
		} else if (args.refundStatus === 'pending') {
			if (order.paymentStatus === 'paid') {
				await ctx.db.patch(order._id, { paymentStatus: 'refund_pending', updatedAt: Date.now() });
				changed = true;
			}
		} else if (order.paymentStatus === 'refund_pending') {
			await ctx.db.patch(order._id, { paymentStatus: 'paid', updatedAt: Date.now() });
			changed = true;
		}

		if (changed && args.actorId) {
			await logAuditEvent(
				ctx,
				{ subject: args.actorId },
				{
					action: AuditActions.RECORD_UPDATED,
					resourceType: 'orders',
					resourceId: order._id,
					severity: 'info'
				}
			);
		}

		return order._id;
	}
});
