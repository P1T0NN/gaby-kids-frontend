// LIBRARIES
import type { Infer } from 'convex/values';
import type Stripe from 'stripe';

// VALIDATORS
import type { stripeRefundEventArgs } from '../validators/stripeValidators.js';

function getPaymentIntentId(paymentIntent: Stripe.Refund['payment_intent']) {
	if (paymentIntent instanceof Object) return paymentIntent.id;
	return paymentIntent;
}

function getRefundStatus(
	status: Stripe.Refund['status']
): Infer<typeof stripeRefundEventArgs>['refundStatus'] {
	if (status === 'pending' || status === 'requires_action') return 'pending';
	if (status === 'succeeded') return 'succeeded';
	if (status === 'failed') return 'failed';
	if (status === 'canceled') return 'canceled';
	throw new Error('Unknown Stripe Refund status.');
}

export function readStripeRefund(
	eventType: Infer<typeof stripeRefundEventArgs>['eventType'],
	refund: Stripe.Refund,
	eventCreatedAt: number
): Infer<typeof stripeRefundEventArgs> {
	const hasInvalidRefund =
		!refund.id ||
		!Number.isSafeInteger(eventCreatedAt) ||
		eventCreatedAt <= 0 ||
		!Number.isSafeInteger(refund.amount) ||
		refund.amount <= 0 ||
		!refund.currency;
	if (hasInvalidRefund) throw new Error('Invalid Stripe Refund.');

	return {
		eventType,
		eventCreatedAt,
		stripeRefundId: refund.id,
		stripePaymentIntentId: getPaymentIntentId(refund.payment_intent),
		refundStatus: getRefundStatus(refund.status),
		currency: refund.currency,
		amountInCents: refund.amount
	};
}
