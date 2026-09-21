// TYPES
import type { Doc } from '../../../_generated/dataModel.js';
import type { MutationCtx } from '../../../_generated/server.js';

export function getEmailClaimMarker(
	ctx: MutationCtx,
	email: string
): Promise<Doc<'customerEmailClaims'> | null> {
	return ctx.db
		.query('customerEmailClaims')
		.withIndex('by_email', (query) => query.eq('email', email))
		.first();
}
