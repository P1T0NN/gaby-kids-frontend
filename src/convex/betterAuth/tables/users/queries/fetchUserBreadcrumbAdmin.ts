// LIBRARIES
import { v } from 'convex/values';
import { components } from '../../../../_generated/api.js';

// BUILDERS
import { adminQuery } from '../../../../builders/convexFunctionBuilders.js';

export const fetchUserBreadcrumbAdmin = adminQuery({
	args: { id: v.string() },
	returns: v.union(v.null(), v.object({ name: v.string() })),
	handler: async (ctx, args) => {
		const user = await ctx.runQuery(components.betterAuth.queries.getUser.getUser, {
			id: args.id
		});

		return user ? { name: user.name } : null;
	}
});
