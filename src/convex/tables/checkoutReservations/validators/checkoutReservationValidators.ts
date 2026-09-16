// LIBRARIES
import { literals } from 'convex-helpers/validators';
import { v } from 'convex/values';

// VALIDATORS
import { checkoutSnapshot, paidOrderArgs } from '../../../stripe/validators/stripeValidators.js';

export const checkoutReservationStatus = literals('active', 'completed', 'released');

export const reservedCheckoutItem = v.object({
	productId: v.id('products'),
	name: v.string(),
	unitPriceInCents: v.number(),
	quantity: v.number(),
	trackInventory: v.boolean()
});

export const checkoutReservationResult = v.object({
	reservationId: v.id('checkoutReservations'),
	expiresAt: v.number(),
	checkout: checkoutSnapshot
});

export const completeCheckoutReservationArgs = paidOrderArgs.extend({
	reservationId: v.id('checkoutReservations')
});
