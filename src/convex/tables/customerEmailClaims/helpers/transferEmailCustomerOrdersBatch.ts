// LIBRARIES
import { v } from 'convex/values';

// BUILDERS
import { internalMutation } from '../../../builders/convexFunctionBuilders.js';

// CONVEX
import { internal } from '../../../_generated/api.js';

// HELPERS
import { finishEmailClaim } from './finishEmailClaim.js';
import { transferOrdersByEmail } from './transferOrdersByEmail.js';

/** Continues an email claim whose order transfer exceeded a single transaction's page. */
export const transferEmailCustomerOrdersBatch = internalMutation({
	args: {
		email: v.string(),
		customerId: v.string(),
		cursor: v.string(),
		revision: v.number()
	},
	returns: v.number(),
	handler: async (ctx, args) => {
		const result = await transferOrdersByEmail(ctx, args.email, args.customerId, args.cursor);
		if (result.continueCursor) {
			await ctx.scheduler.runAfter(
				0,
				internal.tables.customerEmailClaims.helpers.transferEmailCustomerOrdersBatch
					.transferEmailCustomerOrdersBatch,
				{ ...args, cursor: result.continueCursor }
			);
			return result.transferred;
		}

		await finishEmailClaim(ctx, args.email, args.revision);
		return result.transferred;
	}
});
