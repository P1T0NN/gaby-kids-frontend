// LIBRARIES
import { v } from 'convex/values';

// CONVEX
import { components, internal } from '../../../../_generated/api.js';

// WRAPPERS
import { internalMutation } from '../../../../builders/convexFunctionBuilders.js';

// AGGREGATES
import { userTotalAggregate } from '../aggregates/userTotalAggregate.js';

export const backfillUserTotal = internalMutation({
	args: { cursor: v.union(v.null(), v.string()) },
	returns: v.object({ processed: v.number(), nextCursor: v.union(v.null(), v.string()) }),
	handler: async (ctx, args) => {
		const page = await ctx.runQuery(components.betterAuth.queries.listUsers.listUsers, {
			paginationOpts: { numItems: 100, cursor: args.cursor }
		});

		for (const user of page.items) {
			await userTotalAggregate.inc(ctx, 1, user.id);
		}

		if (page.nextCursor !== null) {
			await ctx.scheduler.runAfter(
				0,
				internal.betterAuth.tables.users.migrations.backfillUserTotal.backfillUserTotal,
				{
					cursor: page.nextCursor
				}
			);
		}

		return { processed: page.items.length, nextCursor: page.nextCursor };
	}
});
