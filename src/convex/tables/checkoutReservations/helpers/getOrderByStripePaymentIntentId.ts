// TYPES
import type { Doc } from '../../../_generated/dataModel.js';
import type { MutationCtx } from '../../../_generated/server.js';

export async function getOrderByStripePaymentIntentId(
	ctx: MutationCtx,
	stripePaymentIntentId: string
): Promise<Doc<'orders'> | null> {
	return ctx.db
		.query('orders')
		.withIndex('by_stripePaymentIntentId', (query) =>
			query.eq('stripePaymentIntentId', stripePaymentIntentId)
		)
		.unique();
}
