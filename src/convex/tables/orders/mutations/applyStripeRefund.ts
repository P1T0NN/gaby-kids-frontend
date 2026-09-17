// LIBRARIES
import { AuditActions } from 'convex-audit-log';
import { v, type ObjectType } from 'convex/values';

// BUILDERS
import { internalMutation } from '../../../builders/convexFunctionBuilders.js';

// HELPERS
import { logAuditEvent } from '../../../auditLogs/helpers/logAuditEvent.js';

// VALIDATORS
import { stripeRefundEventArgs } from '../../../stripe/validators/stripeValidators.js';

// TYPES
import type { Doc } from '../../../_generated/dataModel.js';
import type { MutationCtx } from '../../../_generated/server.js';

type Order = Doc<'orders'>;
type RefundEvent = ObjectType<typeof stripeRefundEventArgs.fields>;

/** Reject refund events that do not match the stored order's reference, total or currency. */
function assertValidRefund(order: Order, args: RefundEvent): void {
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
}

/** Move the order to refunded / refund_pending / back to paid; true when it changed. */
async function applyRefundStatus(
	ctx: MutationCtx,
	order: Order,
	args: RefundEvent
): Promise<boolean> {
	if (args.refundStatus === 'succeeded') {
		if (order.paymentStatus !== 'paid' && order.paymentStatus !== 'refund_pending') {
			throw new Error('Stripe refund payment state invariant violated.');
		}

		await ctx.db.patch(order._id, {
			paymentStatus: 'refunded',
			refundedAt: args.eventCreatedAt * 1000,
			refundedAmountInCents: args.amountInCents,
			updatedAt: Date.now()
		});
		return true;
	}

	if (args.refundStatus === 'pending') {
		if (order.paymentStatus !== 'paid') return false;

		await ctx.db.patch(order._id, { paymentStatus: 'refund_pending', updatedAt: Date.now() });
		return true;
	}

	if (order.paymentStatus !== 'refund_pending') return false;

	await ctx.db.patch(order._id, { paymentStatus: 'paid', updatedAt: Date.now() });
	return true;
}

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

		assertValidRefund(order, args);

		const changed = await applyRefundStatus(ctx, order, args);

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
