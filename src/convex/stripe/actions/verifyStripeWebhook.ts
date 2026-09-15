'use node';

// LIBRARIES
import { v } from 'convex/values';
import { internal } from '../../_generated/api.js';
import { env, internalAction } from '../../_generated/server.js';

// CONFIG
import { stripe } from '../stripe.config.js';
import { ORDER_CONFIG } from '../../../shared/features/orders/config.js';

// HELPERS
import { readPaidCheckout } from '../helpers/readPaidCheckout.js';
import { applyStripeCheckoutEvent } from '../helpers/applyStripeCheckoutEvent.js';

// TYPES
import type Stripe from 'stripe';

function getExpectedLiveMode(apiKey: string): boolean {
	if (apiKey.startsWith('sk_live_') || apiKey.startsWith('rk_live_')) return true;
	if (apiKey.startsWith('sk_test_') || apiKey.startsWith('rk_test_')) return false;
	throw new Error('Stripe API key mode could not be determined.');
}

function getPaymentIntentId(paymentIntent: Stripe.Checkout.Session['payment_intent']) {
	if (paymentIntent instanceof Object) return paymentIntent.id;
	return paymentIntent;
}

function getCheckoutStatus(
	status: Stripe.Checkout.Session['status']
): 'open' | 'complete' | 'expired' | null {
	if (status === null) return null;
	if (status === 'open') return 'open';
	if (status === 'complete') return 'complete';
	if (status === 'expired') return 'expired';
	throw new Error('Unknown Stripe Checkout Session status.');
}

function getPaymentStatus(
	status: Stripe.Checkout.Session['payment_status']
): 'paid' | 'unpaid' | 'no_payment_required' {
	if (status === 'paid') return 'paid';
	if (status === 'unpaid') return 'unpaid';
	if (status === 'no_payment_required') return 'no_payment_required';
	throw new Error('Unknown Stripe Checkout payment status.');
}

export const verifyStripeWebhook = internalAction({
	args: {
		payload: v.string(),
		signature: v.string()
	},
	returns: v.boolean(),
	handler: async (ctx, { payload, signature }) => {
		let event: Stripe.Event;
		try {
			event = await stripe.webhooks.constructEventAsync(
				payload,
				signature,
				env.STRIPE_WEBHOOK_SECRET
			);
		} catch {
			return false;
		}

		const expectedLiveMode = getExpectedLiveMode(env.STRIPE_SECRET_KEY);
		if (event.livemode !== expectedLiveMode)
			throw new Error('Stripe webhook environment does not match this deployment.');

		switch (event.type) {
			case 'checkout.session.completed':
			case 'checkout.session.async_payment_succeeded':
			case 'checkout.session.async_payment_failed': {
				const session = event.data.object;
				if (session.livemode !== expectedLiveMode)
					throw new Error('Stripe Checkout Session environment does not match this deployment.');

				const payment = {
					eventType: event.type,
					eventCreatedAt: event.created,
					stripeCheckoutSessionId: session.id,
					stripePaymentIntentId: getPaymentIntentId(session.payment_intent),
					checkoutStatus: getCheckoutStatus(session.status),
					paymentStatus: getPaymentStatus(session.payment_status),
					currency: session.currency,
					totalInCents: session.amount_total
				};

				if (!applyStripeCheckoutEvent(payment)) break;
				const lines = await stripe.checkout.sessions.listLineItems(session.id, {
					limit: ORDER_CONFIG.maxLines + 1,
					expand: ['data.price.product']
				});
				await ctx.runMutation(internal.tables.orders.mutations.createOrder.createOrder, {
					checkout: readPaidCheckout(session, lines),
					payment
				});
				break;
			}
		}

		return true;
	}
});
