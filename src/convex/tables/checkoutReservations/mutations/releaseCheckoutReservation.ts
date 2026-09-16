import { ConvexError, v } from 'convex/values';

// BUILDERS
import { internalMutation } from '../../../builders/convexFunctionBuilders.js';

// HELPERS
import { releaseActiveReservation } from '../helpers/releaseActiveReservation.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

export const releaseCheckoutReservation = internalMutation({
	args: { reservationId: v.id('checkoutReservations') },
	returns: v.boolean(),
	handler: async (ctx, { reservationId }) => {
		const reservation = await ctx.db.get(reservationId);
		if (!reservation) {
			throw new ConvexError<BackendErrorData>({ code: 'CHECKOUT_RESERVATION_NOT_FOUND' });
		}
		return releaseActiveReservation(ctx, reservation);
	}
});
