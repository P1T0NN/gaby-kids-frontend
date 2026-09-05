import { v } from 'convex/values';

import { internalMutation } from '../../_generated/server.js';
import { auditLog } from '../auditLogs.config.js';

export const writeAuditEvent = internalMutation({
	args: {
		actorId: v.string(),
		event: v.any()
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		try {
			await auditLog.log(ctx, { ...args.event, actorId: args.actorId });
		} catch (error) {
			console.error('Failed to write audit event', error);
		}

		return null;
	}
});
