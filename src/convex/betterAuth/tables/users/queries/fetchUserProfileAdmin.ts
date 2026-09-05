// LIBRARIES
import { v } from 'convex/values';
import { components } from '../../../../_generated/api.js';

// BUILDERS
import { adminQuery } from '../../../../builders/convexFunctionBuilders.js';

const userProfile = v.object({
	id: v.string(),
	name: v.string(),
	email: v.string(),
	emailVerified: v.boolean(),
	image: v.union(v.null(), v.string()),
	role: v.string(),
	banned: v.boolean(),
	banReason: v.union(v.null(), v.string()),
	banExpires: v.union(v.null(), v.number()),
	userId: v.union(v.null(), v.string()),
	createdAt: v.number(),
	updatedAt: v.number()
});

export const fetchUserProfileAdmin = adminQuery({
	args: { id: v.string() },
	returns: v.union(v.null(), userProfile),
	handler: async (ctx, args) => {
		const user = await ctx.runQuery(components.betterAuth.queries.getUser.getUser, {
			id: args.id
		});

		if (!user) return null;

		return {
			id: user.id,
			name: user.name,
			email: user.email,
			emailVerified: user.emailVerified,
			image: user.image,
			role: user.role,
			banned: user.banned,
			banReason: user.banReason,
			banExpires: user.banExpires,
			userId: user.userId,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt
		};
	}
});
