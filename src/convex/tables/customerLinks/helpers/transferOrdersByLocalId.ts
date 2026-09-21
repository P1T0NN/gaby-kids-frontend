// CONFIG
import { CLAIM_BATCH_SIZE } from '../../../../shared/features/customerLinks/config.js';

// HELPERS
import { markEmailClaimPending } from '../../customerEmailClaims/helpers/markEmailClaimPending.js';

// TYPES
import type { MutationCtx } from '../../../_generated/server.js';

/**
 * Reassign one batch of a local id's orders to the account and report how many moved. An order
 * whose email is not the claimant's is marked pending, so its real email owner can reclaim it.
 */
export async function transferOrdersByLocalId(
	ctx: MutationCtx,
	localCustomerId: string,
	customerId: string,
	claimantEmail: string | undefined
): Promise<number> {
	const orders = await ctx.db
		.query('orders')
		.withIndex('by_customer_id', (query) => query.eq('customerId', localCustomerId))
		.take(CLAIM_BATCH_SIZE);

	for (const order of orders) {
		await ctx.db.patch(order._id, { customerId });
		if (order.email !== claimantEmail) await markEmailClaimPending(ctx, order.email);
	}

	return orders.length;
}
