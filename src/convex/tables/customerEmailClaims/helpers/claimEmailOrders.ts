// CONVEX
import { internal } from '../../../_generated/api.js';

// HELPERS
import { finishEmailClaim } from './finishEmailClaim.js';
import { getEmailClaimMarker } from './getEmailClaimMarker.js';
import { transferOrdersByEmail } from './transferOrdersByEmail.js';

// TYPES
import type { MutationCtx } from '../../../_generated/server.js';

/**
 * Move an email's orders to the account when the marker says a scan is due. Returns how many
 * orders moved; a scan longer than one page continues through the scheduled batch mutation.
 */
export async function claimEmailOrders(
	ctx: MutationCtx,
	email: string,
	customerId: string
): Promise<number> {
	const marker = await getEmailClaimMarker(ctx, email);
	const hasPendingClaim = !marker || marker.scannedRevision < marker.pendingRevision;
	if (!hasPendingClaim) return 0;

	const revision = marker?.pendingRevision ?? 0;
	const result = await transferOrdersByEmail(ctx, email, customerId, null);
	if (result.continueCursor) {
		await ctx.scheduler.runAfter(
			0,
			internal.tables.customerEmailClaims.helpers.transferEmailCustomerOrdersBatch
				.transferEmailCustomerOrdersBatch,
			{ email, customerId, cursor: result.continueCursor, revision }
		);
	} else {
		await finishEmailClaim(ctx, email, revision);
	}

	return result.transferred;
}
