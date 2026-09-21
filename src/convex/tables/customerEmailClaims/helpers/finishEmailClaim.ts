// HELPERS
import { getEmailClaimMarker } from './getEmailClaimMarker.js';

// TYPES
import type { MutationCtx } from '../../../_generated/server.js';

/**
 * Record a completed scan. Only the revision the scan started from counts as scanned, so a marker
 * written while the scan was running keeps the email pending for the next claim.
 */
export async function finishEmailClaim(
	ctx: MutationCtx,
	email: string,
	revision: number
): Promise<void> {
	const marker = await getEmailClaimMarker(ctx, email);
	if (!marker) {
		await ctx.db.insert('customerEmailClaims', {
			email,
			pendingRevision: revision + 1,
			scannedRevision: revision + 1
		});
		return;
	}

	if (marker.pendingRevision === revision) {
		await ctx.db.patch(marker._id, { scannedRevision: revision });
	}
}
