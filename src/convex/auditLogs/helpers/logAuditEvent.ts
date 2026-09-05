// LIBRARIES
import { internal } from '../../_generated/api.js';

// TYPES
import type { MutationCtx } from '../../_generated/server.js';
import type { AuditEvent, AuditIdentity } from '../types/auditLogsTypes.js';

export async function logAuditEvent(
	ctx: MutationCtx,
	identity: AuditIdentity,
	event: AuditEvent
): Promise<void> {
	try {
		// Only enqueueing is awaited; the audit write runs after this mutation commits.
		await ctx.scheduler.runAfter(0, internal.auditLogs.mutations.writeAuditEvent.writeAuditEvent, {
			actorId: identity.subject,
			event
		});
	} catch (error) {
		console.error('Failed to schedule audit event', error);
	}
}
