// LIBRARIES
import { internal } from '../../_generated/api.js';

// TYPES
import type { MutationCtx } from '../../_generated/server.js';
import type { AuditChangeEvent, AuditIdentity } from '../types/auditLogsTypes.js';

export async function logAuditChange(
	ctx: MutationCtx,
	identity: AuditIdentity,
	event: AuditChangeEvent
): Promise<void> {
	try {
		// Only enqueueing is awaited; the audit write runs after this mutation commits.
		await ctx.scheduler.runAfter(
			0,
			internal.auditLogs.mutations.writeAuditChange.writeAuditChange,
			{
				actorId: identity.subject,
				event
			}
		);
	} catch (error) {
		console.error('Failed to schedule audit change', error);
	}
}
