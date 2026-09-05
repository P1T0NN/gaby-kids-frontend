// LIBRARIES
import { v } from 'convex/values';
import { components } from '../../../../_generated/api.js';

// BUILDERS
import { adminQuery } from '../../../../builders/convexFunctionBuilders.js';

const userSettings = v.object({
	id: v.string(),
	name: v.string(),
	email: v.string(),
	role: v.string(),
	banned: v.boolean(),
	banReason: v.union(v.null(), v.string()),
	banExpires: v.union(v.null(), v.number())
});

export const fetchUserSettingsAdmin = adminQuery({
	args: { id: v.string() },
	returns: v.union(v.null(), userSettings),
	handler: async (ctx, args) => {
		const user = await ctx.runQuery(components.betterAuth.queries.getUser.getUser, {
			id: args.id
		});

		if (!user) return null;

		return {
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
			banned: user.banned,
			banReason: user.banReason,
			banExpires: user.banExpires
		};
	}
});
