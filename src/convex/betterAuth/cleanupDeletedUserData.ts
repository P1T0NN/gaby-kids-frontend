// LIBRARIES
import { v } from 'convex/values';

// CONVEX
import { internal } from '../_generated/api.js';
import { internalMutation } from '../builders/convexFunctionBuilders.js';

// STORAGE
import { queueUploadDeletion } from '../storage/r2.js';

const CLEANUP_BATCH_SIZE = 50;

/** Remove a deleted user's uploads, device links, and now-stale email-claim marker. */
export const cleanupDeletedUserData = internalMutation({
	args: {
		ownerId: v.string(),
		email: v.string()
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const uploadBatches = await Promise.all(
			(['pending', 'processing', 'uploaded'] as const).map((status) =>
				ctx.db
					.query('storageUploads')
					.withIndex('by_owner_id_and_status_and_created_at', (query) =>
						query.eq('ownerId', args.ownerId).eq('status', status)
					)
					.take(CLEANUP_BATCH_SIZE)
			)
		);
		const uploads = uploadBatches.flat();
		if (uploads.length) await queueUploadDeletion(ctx, uploads);

		const links = await ctx.db
			.query('customerLinks')
			.withIndex('by_customer_id', (query) => query.eq('customerId', args.ownerId))
			.take(CLEANUP_BATCH_SIZE);
		for (const link of links) {
			await ctx.db.delete(link._id);
		}

		const markers = await ctx.db
			.query('customerEmailClaims')
			.withIndex('by_email', (query) => query.eq('email', args.email))
			.take(CLEANUP_BATCH_SIZE);
		for (const marker of markers) {
			await ctx.db.delete(marker._id);
		}

		if (uploadBatches.some((batch) => batch.length === CLEANUP_BATCH_SIZE)) {
			await ctx.scheduler.runAfter(
				0,
				internal.betterAuth.cleanupDeletedUserData.cleanupDeletedUserData,
				args
			);
		}
		return null;
	}
});
