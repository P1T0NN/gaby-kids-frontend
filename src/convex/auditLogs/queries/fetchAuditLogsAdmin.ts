// LIBRARIES
import { paginationOptsValidator } from 'convex/server';
import { v } from 'convex/values';
import { components } from '../../_generated/api.js';

// BUILDERS
import { adminQuery } from '../../builders/convexFunctionBuilders.js';

type AuditLogPagination = { limit: number; cursor?: string };

const auditLogItem = v.object({
	id: v.string(),
	action: v.string(),
	actorId: v.union(v.null(), v.string()),
	resourceType: v.union(v.null(), v.string()),
	resourceId: v.union(v.null(), v.string()),
	severity: v.union(
		v.literal('info'),
		v.literal('warning'),
		v.literal('error'),
		v.literal('critical')
	),
	timestamp: v.number()
});

export const fetchAuditLogsAdmin = adminQuery({
	args: { paginationOpts: paginationOptsValidator },
	returns: v.object({
		items: v.array(auditLogItem),
		nextCursor: v.union(v.null(), v.string()),
		hasNextPage: v.boolean(),
		pageSize: v.number()
	}),
	handler: async (ctx, args) => {
		const pagination: AuditLogPagination = {
			limit: args.paginationOpts.numItems
		};
		if (args.paginationOpts.cursor) pagination.cursor = args.paginationOpts.cursor;

		const page = await ctx.runQuery(components.auditLog.lib.search, {
			filters: {},
			pagination
		});

		return {
			items: page.items.map((log) => ({
				id: String(log._id),
				action: log.action,
				actorId: log.actorId ?? null,
				resourceType: log.resourceType ?? null,
				resourceId: log.resourceId ?? null,
				severity: log.severity,
				timestamp: log.timestamp
			})),
			nextCursor: page.hasMore ? page.cursor : null,
			hasNextPage: page.hasMore,
			pageSize: args.paginationOpts.numItems
		};
	}
});
