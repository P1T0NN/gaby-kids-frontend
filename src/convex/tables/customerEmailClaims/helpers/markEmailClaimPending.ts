// HELPERS
import { getEmailClaimMarker } from './getEmailClaimMarker.js';

// TYPES
import type { MutationCtx } from '../../../_generated/server.js';

/** Remember that this email's orders may need a claim pass. */
export async function markEmailClaimPending(ctx: MutationCtx, email: string): Promise<void> {
	const marker = await getEmailClaimMarker(ctx, email);
	if (marker) {
		await ctx.db.patch(marker._id, { pendingRevision: marker.pendingRevision + 1 });
		return;
	}

	await ctx.db.insert('customerEmailClaims', {
		email,
		pendingRevision: 1,
		scannedRevision: 0
	});
}
