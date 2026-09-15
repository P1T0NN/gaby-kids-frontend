// LIBRARIES
import type { Infer } from 'convex/values';
import type { stripeCheckoutEventArgs } from '../validators/stripeValidators.js';

export function applyStripeCheckoutEvent(args: Infer<typeof stripeCheckoutEventArgs>) {
	const hasInvalidEventStatus =
		(args.eventType === 'checkout.session.async_payment_succeeded' &&
			args.paymentStatus !== 'paid') ||
		(args.eventType === 'checkout.session.async_payment_failed' && args.paymentStatus !== 'unpaid');
	if (hasInvalidEventStatus) throw new Error('Stripe Checkout payment status invariant violated.');

	if (args.paymentStatus !== 'paid') return null;

	const paymentIntentId = args.stripePaymentIntentId;
	const hasInvalidPaymentDetails =
		!paymentIntentId || !Number.isSafeInteger(args.eventCreatedAt) || args.eventCreatedAt <= 0;
	if (hasInvalidPaymentDetails) throw new Error('Stripe payment details are incomplete.');

	return { stripePaymentIntentId: paymentIntentId, paidAt: args.eventCreatedAt * 1000 };
}
