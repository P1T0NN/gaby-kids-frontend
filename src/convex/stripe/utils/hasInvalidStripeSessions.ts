// CONFIG
import { ORDER_CONFIG } from '../../../shared/features/orders/config.js';

// TYPES
import type Stripe from 'stripe';

export function hasInvalidStripeSession(
	session: Stripe.Checkout.Session,
	lines: Stripe.ApiList<Stripe.LineItem>
): boolean {
	const metadata = session.metadata;
	const shippingInCents = Number(metadata?.shippingInCents);
	const expectedLineCount =
		Number(metadata?.itemCount) +
		(Number.isSafeInteger(shippingInCents) && shippingInCents > 0 ? 1 : 0);

	return (
		!metadata ||
		session.mode !== 'payment' ||
		session.status !== 'complete' ||
		session.payment_status !== 'paid' ||
		lines.has_more ||
		!Number.isSafeInteger(shippingInCents) ||
		shippingInCents < 0 ||
		lines.data.length > ORDER_CONFIG.maxLines + 1 ||
		lines.data.length !== expectedLineCount ||
		session.amount_total !== Number(metadata.totalInCents) ||
		session.currency !== metadata.currency?.toLowerCase()
	);
}
