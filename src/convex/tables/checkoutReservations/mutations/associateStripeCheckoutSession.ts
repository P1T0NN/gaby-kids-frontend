import { ConvexError, v } from 'convex/values';

// BUILDERS
import { internalMutation } from '../../../builders/convexFunctionBuilders.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

export const associateStripeCheckoutSession = internalMutation({
	args: {
		reservationId: v.id('checkoutReservations'),
		stripeCheckoutSessionId: v.string(),
		expiresAt: v.number()
	},
	returns: v.id('checkoutReservations'),
	handler: async (ctx, args) => {
		const reservation = await ctx.db.get(args.reservationId);
		if (!reservation) {
			throw new ConvexError<BackendErrorData>({ code: 'CHECKOUT_RESERVATION_NOT_FOUND' });
		}
		const hasInvalidAssociation =
			reservation.status !== 'active' ||
			!args.stripeCheckoutSessionId ||
			!Number.isSafeInteger(args.expiresAt) ||
			args.expiresAt <= Date.now();
		if (hasInvalidAssociation) {
			throw new ConvexError<BackendErrorData>({ code: 'CHECKOUT_RESERVATION_CONFLICT' });
		}

		const associatedReservation = await ctx.db
			.query('checkoutReservations')
			.withIndex('by_stripe_checkout_session_id', (query) =>
				query.eq('stripeCheckoutSessionId', args.stripeCheckoutSessionId)
			)
			.unique();
		if (associatedReservation && associatedReservation._id !== reservation._id) {
			throw new ConvexError<BackendErrorData>({ code: 'CHECKOUT_RESERVATION_CONFLICT' });
		}
		if (reservation.stripeCheckoutSessionId !== undefined) {
			if (
				reservation.stripeCheckoutSessionId !== args.stripeCheckoutSessionId ||
				reservation.expiresAt !== args.expiresAt
			) {
				throw new ConvexError<BackendErrorData>({ code: 'CHECKOUT_RESERVATION_CONFLICT' });
			}
			return reservation._id;
		}

		await ctx.db.patch(reservation._id, {
			stripeCheckoutSessionId: args.stripeCheckoutSessionId,
			expiresAt: args.expiresAt
		});
		return reservation._id;
	}
});
