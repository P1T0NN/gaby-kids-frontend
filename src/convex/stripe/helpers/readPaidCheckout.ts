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

function getProduct(line: Stripe.LineItem): Stripe.Product | undefined {
	const product = line.price?.product;
	return product instanceof Object && !('deleted' in product) ? product : undefined;
}

/** Shipping is the one line the app tags itself; product lines carry product metadata. */
function isShippingLine(line: Stripe.LineItem): boolean {
	return getProduct(line)?.metadata.kind === 'shipping';
}

/** The tagged shipping line's amount; zero when the session has no shipping line. */
function readShippingInCents(lines: Stripe.LineItem[], currency: string | null): number {
	if (lines.length === 0) return 0;
	const line = lines[0];
	const unitPriceInCents = line.price?.unit_amount;
	const hasInvalidShippingLine =
		lines.length !== 1 ||
		unitPriceInCents == null ||
		line.quantity !== 1 ||
		line.amount_total !== unitPriceInCents ||
		line.currency !== currency ||
		line.price?.currency !== currency;
	if (hasInvalidShippingLine) throw new Error('Invalid paid Checkout shipping line item.');
	return unitPriceInCents;
}

export function readPaidCheckout(
	session: Stripe.Checkout.Session,
	lines: Stripe.ApiList<Stripe.LineItem>
): Infer<typeof checkoutSnapshot> {
	const metadata = session.metadata;
	if (!metadata || hasInvalidStripeSession(session, lines))
		throw new Error('Invalid paid Checkout Session.');

	const shippingLines = lines.data.filter(isShippingLine);
	const productLines = lines.data.filter((line) => !isShippingLine(line));
	const items = productLines.map((line) => {
		const price = line.price;
		const product = getProduct(line);
		const quantity = line.quantity;
		const unitPriceInCents = price?.unit_amount;
		// The line name carries the variant label for display; the stored metadata
		// keeps the bare product name the reservation snapshot uses. Sessions
		// created before that metadata existed fall back to the line description.
		const name = product?.metadata.productName ?? line.description;
		const hasInvalidLine =
			!price ||
			!product ||
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
	const subtotalInCents = items.reduce(
		(sum, item) => sum + item.unitPriceInCents * item.quantity,
		0
	);

	return {
		...customer,
		items,
		customerId: metadata.customerId || undefined,
		currency: metadata.currency,
		subtotalInCents,
		shippingInCents: readShippingInCents(shippingLines, session.currency),
		totalInCents: Number(metadata.totalInCents)
	};
}
