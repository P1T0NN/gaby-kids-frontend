// LIBRARIES
import { ConvexError, v } from 'convex/values';

// BUILDERS
import { internalMutation } from '../../../builders/convexFunctionBuilders.js';

// SCHEMAS
import { createOrderSchema } from '../../../../shared/features/orders/schemas/ordersSchemas.js';

// HELPERS
import { applyStripeCheckoutEvent } from '../../../stripe/helpers/applyStripeCheckoutEvent.js';
import { createOrderCode } from '../../orders/helpers/createOrderCode.js';
import { getOrderByReceiptToken } from '../helpers/getOrderByReceiptToken.js';
import { getOrderByStripeCheckoutSessionId } from '../helpers/getOrderByStripeCheckoutSessionId.js';
import { getOrderByStripePaymentIntentId } from '../helpers/getOrderByStripePaymentIntentId.js';

// UTILS
import { calculateOrderTotalInCents } from '../../../../shared/utils/pricing.js';
import { hasDifferentItems } from '../../../../shared/features/checkoutReservations/utils/hasDifferentItems.js';
import { hasConflictingOrder as hasConflictingOrderCheck } from '../../../../shared/features/checkoutReservations/utils/hasConflictingOrder.js';
import { hasInvalidCheckoutSnapshot } from '../../../../shared/features/checkoutReservations/utils/hasInvalidCheckoutSnapshot.js';
import { hasInvalidProductInventory as hasInvalidProductInventoryCheck } from '../../../../shared/features/checkoutReservations/utils/hasInvalidProductInventory.js';
import { hasInvalidStripeOrderPayment } from '../../../stripe/utils/hasInvalidStripeOrderPayment.js';

// VALIDATORS
import { completeCheckoutReservationArgs } from '../validators/checkoutReservationValidators.js';

// EMAILS
import { sendOrderCreatedEmails } from '../../orders/emails/sendOrderCreatedEmails.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

// Only a verified Stripe webhook will call this mutation after Chunk 4 wiring.
export const completeCheckoutReservation = internalMutation({
	args: completeCheckoutReservationArgs.fields,
	returns: v.union(v.id('orders'), v.null()),
	handler: async (ctx, { reservationId, checkout, payment: event }) => {
		const payment = applyStripeCheckoutEvent(event);
		if (!payment) return null;

		const data = createOrderSchema.parse(checkout);
		const total = calculateOrderTotalInCents(checkout.items);
		const hasInvalidSnapshot = hasInvalidCheckoutSnapshot(checkout, total);
		if (hasInvalidSnapshot) throw new Error('Stripe order snapshot invariant violated.');

		const reservation = await ctx.db.get(reservationId);
		if (!reservation) {
			throw new ConvexError<BackendErrorData>({ code: 'CHECKOUT_RESERVATION_NOT_FOUND' });
		}
		const hasInvalidReservation =
			reservation.stripeCheckoutSessionId === undefined ||
			reservation.currency !== checkout.currency ||
			reservation.totalInCents !== total ||
			hasDifferentItems(reservation.items, checkout.items) ||
			hasInvalidStripeOrderPayment(reservation, event);
		if (hasInvalidReservation) throw new Error('Checkout reservation snapshot invariant violated.');
		if (reservation.status === 'active' && payment.paidAt > reservation.expiresAt) {
			throw new ConvexError<BackendErrorData>({ code: 'CHECKOUT_RESERVATION_CONFLICT' });
		}

		const existing = await getOrderByStripeCheckoutSessionId(ctx, event.stripeCheckoutSessionId);
		if (reservation.status === 'completed') {
			if (!existing) throw new Error('Completed reservation order invariant violated.');
			const hasConflictingOrder = hasConflictingOrderCheck(existing, {
				stripePaymentIntentId: payment.stripePaymentIntentId,
				receiptToken: data.receiptToken,
				totalInCents: total,
				currency: checkout.currency
			});
			if (hasConflictingOrder) throw new Error('Completed reservation order invariant violated.');
			return existing._id;
		}
		if (reservation.status !== 'active') {
			throw new ConvexError<BackendErrorData>({ code: 'CHECKOUT_RESERVATION_CONFLICT' });
		}
		if (existing) throw new Error('Checkout Session already belongs to another order.');

		const samePayment = await getOrderByStripePaymentIntentId(ctx, payment.stripePaymentIntentId);
		if (samePayment) throw new Error('Payment already belongs to another order.');
		const sameReceipt = await getOrderByReceiptToken(ctx, data.receiptToken);
		if (sameReceipt) throw new Error('Receipt already belongs to another order.');

		const inventoryUpdates = [];
		for (const item of reservation.items) {
			if (!item.trackInventory) continue;
			const product = await ctx.db.get(item.productId);
			if (!product) throw new Error('Checkout reservation inventory invariant violated.');
			const hasInvalidProductInventory = hasInvalidProductInventoryCheck(product, item.quantity);
			if (hasInvalidProductInventory) {
				throw new Error('Checkout reservation inventory invariant violated.');
			}
			inventoryUpdates.push({
				productId: product._id,
				inventory: product.inventory - item.quantity,
				reservedInventory: product.reservedInventory - item.quantity
			});
		}

		let code = createOrderCode();
		for (let attempt = 0; attempt < 7; attempt += 1) {
			const collision = await ctx.db
				.query('orders')
				.withIndex('by_code', (query) => query.eq('code', code))
				.unique();
			if (!collision) break;
			if (attempt === 6) throw new Error('Could not allocate a unique order code.');
			code = createOrderCode();
		}

		for (const update of inventoryUpdates) {
			await ctx.db.patch(update.productId, {
				inventory: update.inventory,
				reservedInventory: update.reservedInventory
			});
		}

		const customer: Omit<typeof data, 'items'> = {
			receiptToken: data.receiptToken,
			firstName: data.firstName,
			lastName: data.lastName,
			email: data.email,
			phone: data.phone,
			fulfillmentMethod: data.fulfillmentMethod
		};

		if (data.shippingAddress) customer.shippingAddress = data.shippingAddress;

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

		for (const item of reservation.items) {
			await ctx.db.insert('orderItems', {
				orderId,
				productId: item.productId,
				name: item.name,
				unitPriceInCents: item.unitPriceInCents,
				quantity: item.quantity
			});
		}

		await ctx.db.patch(reservation._id, { status: 'completed' });

		await sendOrderCreatedEmails(ctx, { ...order, _id: orderId }, checkout.items);

		return orderId;
	}
});
