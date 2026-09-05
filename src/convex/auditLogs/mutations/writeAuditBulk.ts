// LIBRARIES
import { v } from 'convex/values';
import { internalMutation } from '../../_generated/server.js';
import { auditLog } from '../auditLogs.config.js';

export const writeAuditBulk = internalMutation({
	args: {
		actorId: v.string(),
		events: v.array(v.any())
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		try {
			await auditLog.logBulk(
				ctx,
				args.events.map((event) => ({ ...event, actorId: args.actorId }))
			);
		} catch (error) {
			console.error('Failed to write audit events', error);
		}

		return null;
	}
});
