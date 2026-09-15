// LIBRARIES
import type { Infer } from 'convex/values';

// TYPES
import type { Doc } from '../../_generated/dataModel.js';
import type { stripeCheckoutEventArgs } from '../validators/stripeValidators.js';

export function hasInvalidStripeOrderPayment(
	order: Pick<Doc<'orders'>, 'stripeCheckoutSessionId' | 'currency' | 'totalInCents'>,
	session: Pick<
		Infer<typeof stripeCheckoutEventArgs>,
		'stripeCheckoutSessionId' | 'checkoutStatus' | 'currency' | 'totalInCents'
	>
) {
	return (
		order.stripeCheckoutSessionId !== session.stripeCheckoutSessionId ||
		session.checkoutStatus !== 'complete' ||
		session.currency === null ||
		session.currency.toLowerCase() !== order.currency.toLowerCase() ||
		session.totalInCents === null ||
		!Number.isSafeInteger(session.totalInCents) ||
		session.totalInCents !== order.totalInCents
	);
}
