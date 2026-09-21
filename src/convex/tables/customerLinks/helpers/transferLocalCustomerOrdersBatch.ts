// LIBRARIES
import { v } from 'convex/values';

// BUILDERS
import { internalMutation } from '../../../builders/convexFunctionBuilders.js';

// CONVEX
import { internal } from '../../../_generated/api.js';

// CONFIG
import { CLAIM_BATCH_SIZE } from '../../../../shared/features/customerLinks/config.js';

// HELPERS
import { transferOrdersByLocalId } from './transferOrdersByLocalId.js';

/** Continues a device claim whose order transfer exceeded a single transaction's batch. */
export const transferLocalCustomerOrdersBatch = internalMutation({
	args: {
		localCustomerId: v.string(),
		customerId: v.string(),
		claimantEmail: v.optional(v.string())
	},
	returns: v.number(),
	handler: async (ctx, args) => {
		const transferred = await transferOrdersByLocalId(
			ctx,
			args.localCustomerId,
			args.customerId,
			args.claimantEmail
		);
		if (transferred === CLAIM_BATCH_SIZE) {
			await ctx.scheduler.runAfter(
				0,
				internal.tables.customerLinks.helpers.transferLocalCustomerOrdersBatch
					.transferLocalCustomerOrdersBatch,
				args
			);
		}

		return transferred;
	}
});
