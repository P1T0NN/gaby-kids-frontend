// LIBRARIES
import { paginationOptsValidator } from 'convex/server';
import { v } from 'convex/values';
import { components } from '../../../../_generated/api.js';

// BUILDERS
import { adminQuery } from '../../../../builders/convexFunctionBuilders.js';

const sessionItem = v.object({
	id: v.string(),
	expiresAt: v.number(),
	createdAt: v.number(),
	updatedAt: v.number(),
	ipAddress: v.union(v.null(), v.string()),
	userAgent: v.union(v.null(), v.string()),
	impersonatedBy: v.union(v.null(), v.string())
});

const sessionsPage = v.object({
	items: v.array(sessionItem),
	nextCursor: v.union(v.null(), v.string()),
	hasNextPage: v.boolean(),
	pageSize: v.number()
});

export const fetchUserSessionsAdmin = adminQuery({
	args: {
		paginationOpts: paginationOptsValidator,
		userId: v.string()
	},
	returns: sessionsPage,
	handler: async (ctx, args) => {
		const page = await ctx.runQuery(components.betterAuth.queries.listSessions.listSessions, args);

		return {
			items: page.page,
			nextCursor: page.isDone ? null : page.continueCursor,
			hasNextPage: !page.isDone,
			pageSize: args.paginationOpts.numItems
		};
	}
});
