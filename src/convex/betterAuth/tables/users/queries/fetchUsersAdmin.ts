// LIBRARIES
import { paginationOptsValidator } from 'convex/server';
import { v } from 'convex/values';
import { components } from '../../../../_generated/api.js';

// BUILDERS
import { adminQuery } from '../../../../builders/convexFunctionBuilders.js';

// AGGREGATES
import { userTotalAggregate } from '../aggregates/userTotalAggregate.js';

const adminUser = v.object({
	id: v.string(),
	name: v.string(),
	email: v.string(),
	emailVerified: v.boolean(),
	image: v.union(v.null(), v.string()),
	role: v.string(),
	banned: v.boolean(),
	createdAt: v.number()
});

const adminUsersPage = v.object({
	items: v.array(adminUser),
	nextCursor: v.union(v.null(), v.string()),
	hasNextPage: v.boolean(),
	pageSize: v.number(),
	total: v.number()
});

export const fetchUsersAdmin = adminQuery({
	args: {
		paginationOpts: paginationOptsValidator,
		search: v.optional(v.string()),
		filters: v.optional(v.record(v.string(), v.string()))
	},
	returns: adminUsersPage,
	handler: async (ctx, args) => {
		const page = await ctx.runQuery(components.betterAuth.queries.listUsers.listUsers, {
			paginationOpts: args.paginationOpts,
			search: args.search,
			filters: args.filters
		});

		return {
			...page,
			total: await userTotalAggregate.read(ctx)
		};
	}
});
