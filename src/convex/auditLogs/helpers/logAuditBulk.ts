// LIBRARIES
import { internal } from '../../_generated/api.js';

// TYPES
import type { MutationCtx } from '../../_generated/server.js';
import type { AuditEvent, AuditIdentity } from '../types/auditLogsTypes.js';

export async function logAuditBulk(
	ctx: MutationCtx,
	identity: AuditIdentity,
	events: AuditEvent[]
): Promise<void> {
	if (events.length === 0) return;

	try {
		// Only enqueueing is awaited; the audit write runs after this mutation commits.
		await ctx.scheduler.runAfter(0, internal.auditLogs.mutations.writeAuditBulk.writeAuditBulk, {
			actorId: identity.subject,
			events
		});
	} catch (error) {
		console.error('Failed to schedule audit events', error);
	}
}
