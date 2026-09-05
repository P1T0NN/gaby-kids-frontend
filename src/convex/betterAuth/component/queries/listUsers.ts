// LIBRARIES
import { paginationOptsValidator } from 'convex/server';
import { v } from 'convex/values';

// CONVEX
import { api } from '../_generated/api.js';
import { query } from '../_generated/server.js';

// FILTERS
import { buildAdminUserWhere } from '../../tables/users/helpers/filterPredicates.js';

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
	createdAt: v.number()
});

const adminUsersPage = v.object({
	items: v.array(adminUser),
	nextCursor: v.union(v.null(), v.string()),
	hasNextPage: v.boolean(),
	pageSize: v.number()
});

type BetterAuthUser = Doc<'user'>;

export const listUsers = query({
	args: {
		paginationOpts: paginationOptsValidator,
		search: v.optional(v.string()),
		filters: v.optional(v.record(v.string(), v.string()))
	},
	returns: adminUsersPage,
	handler: async (ctx, args) => {
		const search = args.search?.trim().slice(0, 100) || undefined;
		const where = buildAdminUserWhere(search, args.filters);

		// SAFETY: `model: 'user'` makes the Better Auth adapter return user documents.
		const result = (await ctx.runQuery(api.adapter.findMany, {
			model: 'user',
			sortBy: { field: 'createdAt', direction: 'desc' },
			where: where.length > 0 ? where : undefined,
			paginationOpts: args.paginationOpts
		})) as {
			page: BetterAuthUser[];
			isDone: boolean;
			continueCursor: string;
		};

		return {
			items: result.page.map((user) => ({
				id: String(user._id),
				name: user.name,
				email: user.email,
				emailVerified: user.emailVerified,
				image: user.image ?? null,
				role: user.role ?? 'user',
				banned: user.banned ?? false,
				createdAt: user.createdAt
			})),
			nextCursor: result.isDone ? null : result.continueCursor,
			hasNextPage: !result.isDone,
			pageSize: args.paginationOpts.numItems
		};
	}
});
