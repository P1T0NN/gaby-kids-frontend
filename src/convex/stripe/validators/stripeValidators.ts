// LIBRARIES
import { literals } from 'convex-helpers/validators';
import { v } from 'convex/values';

// VALIDATORS
import { createOrderArgs } from '../../tables/orders/validators/orderValidators.js';

export const createStripeCheckoutArgs = createOrderArgs.omit('receiptToken').extend({
	turnstileToken: v.optional(v.string())
});

export const createStripeCheckoutResult = v.object({
	checkoutUrl: v.string()
});

export const checkoutItem = v.object({
	productId: v.id('products'),
	name: v.string(),
	unitPriceInCents: v.number(),
	quantity: v.number(),
	imageUrl: v.optional(v.string())
});

export const checkoutSnapshot = createOrderArgs.omit('items').extend({
	items: v.array(checkoutItem),
	customerId: v.optional(v.string()),
	currency: v.string(),
	totalInCents: v.number()
});

export const stripeCheckoutEventArgs = v.object({
	eventType: literals(
		'checkout.session.completed',
		'checkout.session.async_payment_succeeded',
		'checkout.session.async_payment_failed'
	),
	eventCreatedAt: v.number(),
	stripeCheckoutSessionId: v.string(),
	stripePaymentIntentId: v.union(v.string(), v.null()),
	checkoutStatus: v.union(literals('open', 'complete', 'expired'), v.null()),
	paymentStatus: literals('paid', 'unpaid', 'no_payment_required'),
	currency: v.union(v.string(), v.null()),
	totalInCents: v.union(v.number(), v.null())
});

export const stripeRefundEventArgs = v.object({
	eventType: literals('refund.created', 'refund.updated', 'refund.failed'),
	eventCreatedAt: v.number(),
	stripeRefundId: v.string(),
	stripePaymentIntentId: v.union(v.string(), v.null()),
	refundStatus: literals('pending', 'succeeded', 'failed', 'canceled'),
	currency: v.string(),
	amountInCents: v.number()
});

export const paidOrderArgs = v.object({
	checkout: checkoutSnapshot,
	payment: stripeCheckoutEventArgs
});
