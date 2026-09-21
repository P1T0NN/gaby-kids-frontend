// LIBRARIES
import { v } from 'convex/values';

// CONVEX
import { internal } from '../_generated/api.js';
import { internalMutation } from '../builders/convexFunctionBuilders.js';

// STORAGE
import { r2 } from '../storage/r2.js';

const CLEANUP_BATCH_SIZE = 50;

/** Remove a deleted user's uploads, device links, and now-stale email-claim marker. */
export const cleanupDeletedUserData = internalMutation({
	args: {
		ownerId: v.string(),
		email: v.string()
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const uploads = await ctx.db
			.query('storageUploads')
			.withIndex('by_owner_id_created_at', (query) => query.eq('ownerId', args.ownerId))
			.take(CLEANUP_BATCH_SIZE);
		for (const upload of uploads) {
			await r2.deleteObject(ctx, upload.key);
			await ctx.db.delete(upload._id);
		}

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

		if (uploads.length === CLEANUP_BATCH_SIZE) {
			await ctx.scheduler.runAfter(
				0,
				internal.betterAuth.cleanupDeletedUserData.cleanupDeletedUserData,
				args
			);
		}
		return null;
	}
});
