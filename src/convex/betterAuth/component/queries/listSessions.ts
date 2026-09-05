import { paginationOptsValidator, paginationResultValidator } from 'convex/server';
import { paginator } from 'convex-helpers/server/pagination';
import { v } from 'convex/values';

import { query } from '../_generated/server.js';

import schema from '../schema.js';

import type { Doc } from '../_generated/dataModel.js';

const sessionItem = v.object({
	id: v.string(),
	expiresAt: v.number(),
	createdAt: v.number(),
	updatedAt: v.number(),
	ipAddress: v.union(v.null(), v.string()),
	userAgent: v.union(v.null(), v.string()),
	impersonatedBy: v.union(v.null(), v.string())
});

type BetterAuthSession = Doc<'session'>;

export const listSessions = query({
	args: {
		paginationOpts: paginationOptsValidator,
		userId: v.string()
	},
	returns: paginationResultValidator(sessionItem),
	handler: async (ctx, args) => {
		const result = await paginator(ctx.db, schema)
			.query('session')
			.withIndex('userId', (query) => query.eq('userId', args.userId))
			.order('desc')
			.paginate(args.paginationOpts);

		return {
			...result,
			page: result.page.map((session: BetterAuthSession) => ({
				id: String(session._id),
				expiresAt: session.expiresAt,
				createdAt: session.createdAt,
				updatedAt: session.updatedAt,
				ipAddress: session.ipAddress ?? null,
				userAgent: session.userAgent ?? null,
				impersonatedBy: session.impersonatedBy ?? null
			}))
		};
	}
});
