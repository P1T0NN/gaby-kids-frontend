// LIBRARIES
import { v } from 'convex/values';

// BUILDERS
import { authenticatedMutation } from '../../../builders/convexFunctionBuilders.js';

// CONVEX
import { internal } from '../../../_generated/api.js';

// CONFIG
import { CLAIM_BATCH_SIZE } from '../../../../shared/features/customerLinks/config.js';

// HELPERS
import { claimEmailOrders } from '../../customerEmailClaims/helpers/claimEmailOrders.js';
import { transferOrdersByLocalId } from '../helpers/transferOrdersByLocalId.js';

// UTILS
import { isUuid } from '../../../../shared/utils/isUuid.js';

// TYPES
import type { MutationCtx } from '../../../_generated/server.js';

/** Bind this device's local id to the account and move the orders it placed. */
async function claimLocalOrders(
	ctx: MutationCtx,
	localCustomerId: string,
	customerId: string,
	claimantEmail: string | undefined
): Promise<number> {
	const link = await ctx.db
		.query('customerLinks')
		.withIndex('by_local_customer_id', (query) => query.eq('localCustomerId', localCustomerId))
		.unique();

	// A local id binds to one account, so another account's device stays untouched.
	if (link && link.customerId !== customerId) return 0;

	if (!link) {
		await ctx.db.insert('customerLinks', { localCustomerId, customerId, linkedAt: Date.now() });
	}

	const transferred = await transferOrdersByLocalId(
		ctx,
		localCustomerId,
		customerId,
		claimantEmail
	);
	if (transferred === CLAIM_BATCH_SIZE) {
		await ctx.scheduler.runAfter(
			0,
			internal.tables.customerLinks.helpers.transferLocalCustomerOrdersBatch
				.transferLocalCustomerOrdersBatch,
			{ localCustomerId, customerId, claimantEmail }
		);
	}

	return transferred;
}

/**
 * Reconciles the signed-in account with past orders: orders tagged with this device's local id
 * follow the account, and orders placed with the account's verified email come to it even when
 * another account is holding them. Idempotent; call it after sign-in.
 */
export const claimCustomerOrders = authenticatedMutation({
	rateLimit: { name: 'customers:claim' },
	args: { localCustomerId: v.string() },
	returns: v.number(),
	handler: async (ctx, args) => {
		const customerId = ctx.identity.subject;
		const email = ctx.identity.email?.toLowerCase();
		let transferred = 0;

		if (isUuid(args.localCustomerId)) {
			transferred += await claimLocalOrders(ctx, args.localCustomerId, customerId, email);
		}

		if (email) {
			transferred += await claimEmailOrders(ctx, email, customerId);
		}

		return transferred;
	}
});
