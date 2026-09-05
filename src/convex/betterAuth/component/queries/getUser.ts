// LIBRARIES
import { v } from 'convex/values';

// CONVEX
import { api } from '../_generated/api.js';
import { query } from '../_generated/server.js';

// TYPES
import type { Doc } from '../_generated/dataModel.js';

const adminUser = v.object({
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

type BetterAuthUser = Doc<'user'>;

export const getUser = query({
	args: { id: v.string() },
	returns: v.union(v.null(), adminUser),
	handler: async (ctx, args) => {
		const result = await ctx.runQuery(api.adapter.findOne, {
			model: 'user',
			where: [{ field: '_id', value: args.id }]
		});
		// SAFETY: The Better Auth adapter returns a user document for model `user`.
		const user = result as BetterAuthUser | null;

		if (!user) return null;

		return {
			id: String(user._id),
			name: user.name,
			email: user.email,
			emailVerified: user.emailVerified,
			image: user.image ?? null,
			role: user.role ?? 'user',
			banned: user.banned ?? false,
			banReason: user.banReason ?? null,
			banExpires: user.banExpires ?? null,
			userId: user.userId ?? null,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt
		};
	}
});
