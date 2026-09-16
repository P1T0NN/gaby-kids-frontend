import { v } from 'convex/values';

// CONVEX
import { internal } from '../../../_generated/api.js';
import { internalMutation } from '../../../builders/convexFunctionBuilders.js';

// CONFIG
import { ORDER_CONFIG } from '../../../../shared/features/orders/config.js';

// HELPERS
import { releaseActiveReservation } from '../helpers/releaseActiveReservation.js';

export const deleteExpiredCheckoutReservationsCron = internalMutation({
	args: {},
	returns: v.number(),
	handler: async (ctx) => {
		const expired = await ctx.db
			.query('checkoutReservations')
			.withIndex('by_status_and_expires_at', (query) =>
				query.eq('status', 'active').lte('expiresAt', Date.now())
			)
			.take(ORDER_CONFIG.reservationCleanupBatchSize);

		for (const reservation of expired) await releaseActiveReservation(ctx, reservation);
		if (expired.length === ORDER_CONFIG.reservationCleanupBatchSize) {
			await ctx.scheduler.runAfter(
				0,
				internal.tables.checkoutReservations.crons.deleteExpiredCheckoutReservationsCron
					.deleteExpiredCheckoutReservationsCron,
				{}
			);
		}
		return expired.length;
	}
});
