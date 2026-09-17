// LIBRARIES
import type Stripe from 'stripe';
import type { Infer } from 'convex/values';

// SCHEMAS
import { createOrderSchema } from '../../../shared/features/orders/schemas/ordersSchemas.js';

// UTILS
import { hasInvalidStripeSession } from '../utils/hasInvalidStripeSessions.js';

// TYPES
import type { checkoutSnapshot } from '../validators/stripeValidators.js';
import type { Id } from '../../_generated/dataModel.js';

export function readPaidCheckout(
	session: Stripe.Checkout.Session,
	lines: Stripe.ApiList<Stripe.LineItem>
): Infer<typeof checkoutSnapshot> {
	const metadata = session.metadata;
	if (!metadata || hasInvalidStripeSession(session, lines))
		throw new Error('Invalid paid Checkout Session.');

	const items = lines.data.map((line) => {
		const price = line.price;
		const product = price?.product;
		const quantity = line.quantity;
		const unitPriceInCents = price?.unit_amount;
		// The line name carries the variant label for display; the stored metadata
		// keeps the bare product name the reservation snapshot uses. Sessions
		// created before that metadata existed fall back to the line description.
		const name =
			product instanceof Object && !('deleted' in product)
				? (product.metadata.productName ?? line.description)
				: undefined;
		const hasInvalidLine =
			!price ||
			!(product instanceof Object) ||
			'deleted' in product ||
			!product.metadata.productId ||
			!product.metadata.productVariantId ||
			!name ||
			unitPriceInCents == null ||
			quantity === null ||
			line.currency !== session.currency ||
			price.currency !== session.currency ||
			line.amount_total !== unitPriceInCents * quantity;
		if (hasInvalidLine) throw new Error('Invalid paid Checkout line item.');
		return {
			// SAFETY: the internal mutation checks this Stripe-owned value with v.id('products').
			productId: product.metadata.productId as Id<'products'>,
			// SAFETY: the internal mutation checks this Stripe-owned value with v.id('productVariants').
			productVariantId: product.metadata.productVariantId as Id<'productVariants'>,
			name,
			productVariantLabel: product.metadata.productVariantLabel ?? '',
			sku: product.metadata.sku ?? '',
			unitPriceInCents,
			quantity
		};
	});
	const customer = createOrderSchema.parse({
		...metadata,
		items,
		shippingAddress:
			metadata.fulfillmentMethod === 'delivery'
				? {
						street: metadata.street,
						apartment: metadata.apartment,
						postalCode: metadata.postalCode,
						city: metadata.city,
						country: metadata.country
					}
				: undefined
	});
	return {
		...customer,
		items,
		customerId: metadata.customerId || undefined,
		currency: metadata.currency,
		totalInCents: Number(metadata.totalInCents)
	};
}
