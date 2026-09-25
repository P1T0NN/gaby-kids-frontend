// LIBRARIES
import { v, type ObjectType } from 'convex/values';

// BUILDERS
import { internalMutation } from '../../../builders/convexFunctionBuilders.js';

// CONFIG
import { ORDER_CONFIG } from '../../../../shared/features/orders/config.js';

// VALIDATORS
import { paidOrderArgs } from '../../../stripe/validators/stripeValidators.js';
import { createOrderSchema } from '../../../../shared/features/orders/schemas/ordersSchemas.js';

// HELPERS
import { allocateOrderCode } from '../helpers/allocateOrderCode.js';
import { applyStripeCheckoutEvent } from '../../../stripe/helpers/applyStripeCheckoutEvent.js';
import { insertOrderItems } from '../helpers/insertOrderItems.js';
import { markEmailClaimPending } from '../../customerEmailClaims/helpers/markEmailClaimPending.js';

// UTILS
import { buildOrderCustomer } from '../../../../shared/features/orders/utils/buildOrderCustomer.js';
import { calculateOrderTotalInCents } from '../../../../shared/utils/pricing.js';
import { calculateShippingInCents } from '../../../../shared/features/orders/utils/calculateShippingInCents.js';
import { hasInvalidOrderItems } from '../../../../shared/features/orders/utils/hasInvalidOrderItems.js';
import { hasInvalidStripeOrderPayment } from '../../../stripe/utils/hasInvalidStripeOrderPayment.js';

// EMAILS
import { sendOrderCreatedEmails } from '../emails/sendOrderCreatedEmails.js';

// TYPES
import type { Id } from '../../../_generated/dataModel.js';
import type { MutationCtx } from '../../../_generated/server.js';

type PaidOrderArgs = ObjectType<typeof paidOrderArgs.fields>;
type CheckoutSnapshot = PaidOrderArgs['checkout'];
type PaymentEvent = PaidOrderArgs['payment'];
type AppliedPayment = NonNullable<ReturnType<typeof applyStripeCheckoutEvent>>;

/** Reject snapshots whose items, total, or payment details are not internally consistent. */
function assertValidSnapshot(
	checkout: CheckoutSnapshot,
	event: PaymentEvent,
	subtotal: number
): void {
	const total = subtotal + checkout.shippingInCents;
	const hasInvalidSnapshot =
		hasInvalidOrderItems(checkout.items) ||
		!Number.isSafeInteger(subtotal) ||
		subtotal <= 0 ||
		subtotal !== checkout.subtotalInCents ||
		!Number.isSafeInteger(checkout.shippingInCents) ||
		checkout.shippingInCents < 0 ||
		checkout.shippingInCents !== calculateShippingInCents(subtotal, checkout.fulfillmentMethod) ||
		!Number.isSafeInteger(total) ||
		total !== checkout.totalInCents ||
		new Set(checkout.items.map((item) => item.productVariantId)).size !== checkout.items.length ||
		checkout.items.some((item) => !item.name.trim() || item.quantity > ORDER_CONFIG.maxQuantity);
	if (hasInvalidSnapshot) throw new Error('Stripe order snapshot invariant violated.');

	const hasInvalidPayment = hasInvalidStripeOrderPayment(
		{
			stripeCheckoutSessionId: event.stripeCheckoutSessionId,
			currency: checkout.currency,
			totalInCents: total
		},
		event
	);
	if (hasInvalidPayment) throw new Error('Stripe Checkout Session invariant violated.');
}

/** Replayed webhooks return the order this session already produced; null for a fresh order. */
async function resolveExistingOrder(
	ctx: MutationCtx,
	options: {
		event: PaymentEvent;
		payment: AppliedPayment;
		total: number;
		currency: string;
		receiptToken: string;
	}
): Promise<Id<'orders'> | null> {
	const existing = await ctx.db
		.query('orders')
		.withIndex('by_stripeCheckoutSessionId', (q) =>
			q.eq('stripeCheckoutSessionId', options.event.stripeCheckoutSessionId)
		)
		.unique();

	if (existing) {
		const hasConflictingPayment =
			existing.stripePaymentIntentId !== options.payment.stripePaymentIntentId ||
			existing.totalInCents !== options.total ||
			existing.currency !== options.currency;
		if (hasConflictingPayment) throw new Error('Order already has different payment details.');
		return existing._id;
	}

	const samePayment = await ctx.db
		.query('orders')
		.withIndex('by_stripePaymentIntentId', (q) =>
			q.eq('stripePaymentIntentId', options.payment.stripePaymentIntentId)
		)
		.unique();
	if (samePayment) throw new Error('Payment already belongs to another order.');

	const sameReceipt = await ctx.db
		.query('orders')
		.withIndex('by_receiptToken', (q) => q.eq('receiptToken', options.receiptToken))
		.unique();
	if (sameReceipt) throw new Error('Receipt already belongs to another order.');

	return null;
}

// Only the verified Stripe webhook supplies these snapshots, never the browser.
export const createOrder = internalMutation({
	args: paidOrderArgs.fields,
	returns: v.union(v.id('orders'), v.null()),
	handler: async (ctx, { checkout, payment: event }) => {
		const payment = applyStripeCheckoutEvent(event);
		if (!payment) return null;

		const data = createOrderSchema.parse(checkout);
		const subtotal = calculateOrderTotalInCents(checkout.items);
		assertValidSnapshot(checkout, event, subtotal);
		const total = subtotal + checkout.shippingInCents;

		const existingOrderId = await resolveExistingOrder(ctx, {
			event,
			payment,
			total,
			currency: checkout.currency,
			receiptToken: data.receiptToken
		});
		if (existingOrderId) return existingOrderId;

		const code = await allocateOrderCode(ctx);
		const customer = buildOrderCustomer(data);
		const order = {
			...customer,
			customerId: checkout.customerId,
			code,
			lineFingerprint: JSON.stringify(checkout.items),
			currency: checkout.currency,
			subtotalInCents: subtotal,
			shippingInCents: checkout.shippingInCents,
			totalInCents: total,
			paymentStatus: 'paid' as const,
			fulfillmentStatus: 'unfulfilled' as const,
			stripeCheckoutSessionId: event.stripeCheckoutSessionId,
			checkoutStatus: 'complete' as const,
			...payment,
			updatedAt: Date.now()
		};
		const orderId = await ctx.db.insert('orders', order);
		await markEmailClaimPending(ctx, order.email);
		await insertOrderItems(ctx, orderId, checkout.items);
		await sendOrderCreatedEmails(ctx, { ...order, _id: orderId }, checkout.items);

		return orderId;
	}
});
