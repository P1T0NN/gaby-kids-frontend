// LIBRARIES
import { ConvexError, v } from 'convex/values';

// BUILDERS
import { internalMutation } from '../../../builders/convexFunctionBuilders.js';

// SCHEMAS
import { createOrderSchema } from '../../../../shared/features/orders/schemas/ordersSchemas.js';

// HELPERS
import { allocateOrderCode } from '../../orders/helpers/allocateOrderCode.js';
import { applyStripeCheckoutEvent } from '../../../stripe/helpers/applyStripeCheckoutEvent.js';
import { getOrderByReceiptToken } from '../helpers/getOrderByReceiptToken.js';
import { getOrderByStripeCheckoutSessionId } from '../helpers/getOrderByStripeCheckoutSessionId.js';
import { getOrderByStripePaymentIntentId } from '../helpers/getOrderByStripePaymentIntentId.js';
import { insertOrderItems } from '../../orders/helpers/insertOrderItems.js';

// UTILS
import { buildOrderCustomer } from '../../../../shared/features/orders/utils/buildOrderCustomer.js';
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
import type { Doc, Id } from '../../../_generated/dataModel.js';
import type { MutationCtx } from '../../../_generated/server.js';
import type { BackendErrorData } from '../../../../shared/types/types.js';

type Reservation = Doc<'checkoutReservations'>;
type Order = Doc<'orders'>;
type AppliedPayment = NonNullable<ReturnType<typeof applyStripeCheckoutEvent>>;
type InventoryUpdate = { productId: Id<'products'>; inventory: number; reservedInventory: number };

/**
 * Replayed webhooks return the order the completed reservation already produced;
 * a fresh completion returns null (after rejecting foreign sessions/payments/receipts).
 */
async function resolveReplayedOrder(
	ctx: MutationCtx,
	options: {
		reservation: Reservation;
		existing: Order | null;
		payment: AppliedPayment;
		receiptToken: string;
		total: number;
		currency: string;
	}
): Promise<Id<'orders'> | null> {
	const { reservation, existing, payment } = options;

	if (reservation.status === 'completed') {
		if (!existing) throw new Error('Completed reservation order invariant violated.');
		const hasConflictingOrder = hasConflictingOrderCheck(existing, {
			stripePaymentIntentId: payment.stripePaymentIntentId,
			receiptToken: options.receiptToken,
			totalInCents: options.total,
			currency: options.currency
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
	const sameReceipt = await getOrderByReceiptToken(ctx, options.receiptToken);
	if (sameReceipt) throw new Error('Receipt already belongs to another order.');

	return null;
}

/** Skip untracked products and collect the inventory patches for the paid quantities. */
async function buildInventoryUpdates(
	ctx: MutationCtx,
	items: Reservation['items']
): Promise<InventoryUpdate[]> {
	const updates: InventoryUpdate[] = [];

	for (const item of items) {
		if (!item.trackInventory) continue;

		const product = await ctx.db.get(item.productId);
		if (!product) throw new Error('Checkout reservation inventory invariant violated.');
		if (hasInvalidProductInventoryCheck(product, item.quantity)) {
			throw new Error('Checkout reservation inventory invariant violated.');
		}

		updates.push({
			productId: product._id,
			inventory: product.inventory - item.quantity,
			reservedInventory: product.reservedInventory - item.quantity
		});
	}

	return updates;
}

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
		const replayedOrderId = await resolveReplayedOrder(ctx, {
			reservation,
			existing,
			payment,
			receiptToken: data.receiptToken,
			total,
			currency: checkout.currency
		});
		if (replayedOrderId) return replayedOrderId;

		const inventoryUpdates = await buildInventoryUpdates(ctx, reservation.items);
		const code = await allocateOrderCode(ctx);

		for (const update of inventoryUpdates) {
			await ctx.db.patch(update.productId, {
				inventory: update.inventory,
				reservedInventory: update.reservedInventory
			});
		}

		const customer = buildOrderCustomer(data);

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
		await insertOrderItems(ctx, orderId, reservation.items);
		await ctx.db.patch(reservation._id, { status: 'completed' });

		await sendOrderCreatedEmails(ctx, { ...order, _id: orderId }, checkout.items);

		return orderId;
	}
});
