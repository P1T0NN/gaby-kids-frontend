// LIBRARIES
import { paginationOptsValidator } from 'convex/server';
import { v } from 'convex/values';
import type { PaginationOptions } from 'convex-audit-log';
import { components } from '../../../../_generated/api.js';

// BUILDERS
import { adminQuery } from '../../../../builders/convexFunctionBuilders.js';

const auditLogItem = v.object({
	id: v.string(),
	action: v.string(),
	resourceType: v.union(v.null(), v.string()),
	resourceId: v.union(v.null(), v.string()),
	severity: v.union(
		v.literal('info'),
		v.literal('warning'),
		v.literal('error'),
		v.literal('critical')
	),
	timestamp: v.number(),
	ipAddress: v.union(v.null(), v.string()),
	userAgent: v.union(v.null(), v.string()),
	sessionId: v.union(v.null(), v.string()),
	tags: v.array(v.string())
});

const auditLogsPage = v.object({
	items: v.array(auditLogItem),
	nextCursor: v.union(v.null(), v.string()),
	hasNextPage: v.boolean(),
	pageSize: v.number()
});

export const fetchUserLogsAdmin = adminQuery({
	args: {
		paginationOpts: paginationOptsValidator,
		userId: v.string()
	},
	returns: auditLogsPage,
	handler: async (ctx, args) => {
		const pagination: PaginationOptions = {
			limit: args.paginationOpts.numItems
		};
		if (args.paginationOpts.cursor) pagination.cursor = args.paginationOpts.cursor;

		const page = await ctx.runQuery(components.auditLog.lib.search, {
			filters: { actorIds: [args.userId] },
			pagination
		});

		const hasNextPage = page.hasMore && page.cursor !== null;

		return {
			items: page.items.map((log) => ({
				id: String(log._id),
				action: log.action,
				resourceType: log.resourceType ?? null,
				resourceId: log.resourceId ?? null,
				severity: log.severity,
				timestamp: log.timestamp,
				ipAddress: log.ipAddress ?? null,
				userAgent: log.userAgent ?? null,
				sessionId: log.sessionId ?? null,
				tags: log.tags ?? []
			})),
			nextCursor: hasNextPage ? page.cursor : null,
			hasNextPage,
			pageSize: args.paginationOpts.numItems
		};
	}
});
