// TYPES
import type { Doc } from '../../../_generated/dataModel.js';
import type { MutationCtx } from '../../../_generated/server.js';

export async function getOrderByStripeCheckoutSessionId(
	ctx: MutationCtx,
	stripeCheckoutSessionId: string
): Promise<Doc<'orders'> | null> {
	return ctx.db
		.query('orders')
		.withIndex('by_stripeCheckoutSessionId', (query) =>
			query.eq('stripeCheckoutSessionId', stripeCheckoutSessionId)
		)
		.unique();
}
