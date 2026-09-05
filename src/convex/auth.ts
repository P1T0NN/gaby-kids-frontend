// LIBRARIES
import { v } from 'convex/values';

// CONVEX
import { query } from './_generated/server.js';

// AUTH
import { authComponent } from './betterAuth/config.js';

export const getCurrentUser = query({
	args: {},
	returns: v.object({
		id: v.string(),
		name: v.string(),
		email: v.string(),
		emailVerified: v.boolean(),
		image: v.optional(v.union(v.null(), v.string())),
		role: v.optional(v.union(v.null(), v.string())),
		banned: v.optional(v.union(v.null(), v.boolean())),
		banExpires: v.optional(v.union(v.null(), v.number()))
	}),
	handler: async (ctx) => {
		const user = await authComponent.getAuthUser(ctx);
		return {
			id: String(user._id),
			name: user.name,
			email: user.email,
			emailVerified: user.emailVerified,
			image: user.image,
			role: user.role,
			banned: user.banned,
			banExpires: user.banExpires
		};
	}
});

export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();
