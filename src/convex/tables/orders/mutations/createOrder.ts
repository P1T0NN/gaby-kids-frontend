// LIBRARIES
import { v } from 'convex/values';

// BUILDERS
import { internalMutation } from '../../../builders/convexFunctionBuilders.js';

// CONFIG
import { ORDER_CONFIG } from '../../../../shared/features/orders/config.js';

// VALIDATORS
import { paidOrderArgs } from '../../../stripe/validators/stripeValidators.js';
import { createOrderSchema } from '../../../../shared/features/orders/schemas/ordersSchemas.js';

// HELPERS
import { createOrderCode } from '../helpers/createOrderCode.js';
import { applyStripeCheckoutEvent } from '../../../stripe/helpers/applyStripeCheckoutEvent.js';

// UTILS
import { calculateOrderTotalInCents } from '../../../../shared/features/orders/utils/calculateOrders.js';
import { hasInvalidOrderItems } from '../../../../shared/features/orders/utils/hasInvalidOrderItems.js';
import { hasInvalidStripeOrderPayment } from '../../../stripe/utils/hasInvalidStripeOrderPayment.js';

// EMAILS
import { sendOrderCreatedEmails } from '../emails/sendOrderCreatedEmails.js';

// Only the verified Stripe webhook supplies these snapshots, never the browser.
export const createOrder = internalMutation({
	args: paidOrderArgs.fields,
	returns: v.union(v.id('orders'), v.null()),
	handler: async (ctx, { checkout, payment: event }) => {
		const payment = applyStripeCheckoutEvent(event);
		if (!payment) return null;

		const data = createOrderSchema.parse(checkout);
		const total = calculateOrderTotalInCents(checkout.items);
		const hasInvalidSnapshot =
			hasInvalidOrderItems(checkout.items) ||
			!Number.isSafeInteger(total) ||
			total <= 0 ||
			total !== checkout.totalInCents ||
			new Set(checkout.items.map((item) => item.productId)).size !== checkout.items.length ||
			checkout.items.some((item) => !item.name.trim() || item.quantity > ORDER_CONFIG.maxQuantity);
		if (hasInvalidSnapshot) throw new Error('Stripe order snapshot invariant violated.');
		if (
			hasInvalidStripeOrderPayment(
				{
					stripeCheckoutSessionId: event.stripeCheckoutSessionId,
					currency: checkout.currency,
					totalInCents: total
				},
				event
			)
		)
			throw new Error('Stripe Checkout Session invariant violated.');

		const existing = await ctx.db
			.query('orders')
			.withIndex('by_stripeCheckoutSessionId', (q) =>
				q.eq('stripeCheckoutSessionId', event.stripeCheckoutSessionId)
			)
			.unique();
		if (existing) {
			const hasConflictingPayment =
				existing.stripePaymentIntentId !== payment.stripePaymentIntentId ||
				existing.totalInCents !== total ||
				existing.currency !== checkout.currency;
			if (hasConflictingPayment) throw new Error('Order already has different payment details.');
			return existing._id;
		}
		const samePayment = await ctx.db
			.query('orders')
			.withIndex('by_stripePaymentIntentId', (q) =>
				q.eq('stripePaymentIntentId', payment.stripePaymentIntentId)
			)
			.unique();
		if (samePayment) throw new Error('Payment already belongs to another order.');
		const sameReceipt = await ctx.db
			.query('orders')
			.withIndex('by_receiptToken', (q) => q.eq('receiptToken', data.receiptToken))
			.unique();
		if (sameReceipt) throw new Error('Receipt already belongs to another order.');

		let code = createOrderCode();
		for (let attempt = 0; attempt < 7; attempt += 1) {
			const collision = await ctx.db
				.query('orders')
				.withIndex('by_code', (q) => q.eq('code', code))
				.unique();
			if (!collision) break;
			if (attempt === 6) throw new Error('Could not allocate a unique order code.');
			code = createOrderCode();
		}

		const { items: _items, ...customer } = data;
		const order = {
			...customer,
			customerId: checkout.customerId,
			code,
			lineFingerprint: JSON.stringify(checkout.items),
			currency: checkout.currency,
			subtotalInCents: total,
			totalInCents: total,
			paymentStatus: 'paid' as const,
			fulfillmentStatus: 'unfulfilled' as const,
			stripeCheckoutSessionId: event.stripeCheckoutSessionId,
			checkoutStatus: 'complete' as const,
			...payment,
			updatedAt: Date.now()
		};
		const orderId = await ctx.db.insert('orders', order);
		for (const item of checkout.items) {
			const orderItem = {
				productId: item.productId,
				name: item.name,
				unitPriceInCents: item.unitPriceInCents,
				quantity: item.quantity
			};
			await ctx.db.insert('orderItems', { orderId, ...orderItem });
		}
		await sendOrderCreatedEmails(ctx, { ...order, _id: orderId }, checkout.items);
		return orderId;
	}
});
