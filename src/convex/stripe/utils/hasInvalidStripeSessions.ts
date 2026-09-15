// CONFIG
import { ORDER_CONFIG } from '../../../shared/features/orders/config.js';

// TYPES
import type Stripe from 'stripe';

export function hasInvalidStripeSession(
	session: Stripe.Checkout.Session,
	lines: Stripe.ApiList<Stripe.LineItem>
): boolean {
	const metadata = session.metadata;
	return (
		!metadata ||
		session.mode !== 'payment' ||
		session.status !== 'complete' ||
		session.payment_status !== 'paid' ||
		lines.has_more ||
		lines.data.length > ORDER_CONFIG.maxLines ||
		lines.data.length !== Number(metadata.itemCount) ||
		session.amount_total !== Number(metadata.totalInCents) ||
		session.currency !== metadata.currency?.toLowerCase()
	);
}
