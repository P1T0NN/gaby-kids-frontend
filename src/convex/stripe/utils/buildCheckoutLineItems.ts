// TYPES
import type { Doc } from '../../_generated/dataModel.js';

type OrderItem = Pick<
	Doc<'orderItems'>,
	| 'productId'
	| 'productVariantId'
	| 'name'
	| 'productVariantLabel'
	| 'sku'
	| 'unitPriceInCents'
	| 'quantity'
> & {
	imageUrl?: string;
};

function buildCheckoutLineItemName(item: OrderItem): string {
	return item.productVariantLabel ? `${item.name} — ${item.productVariantLabel}` : item.name;
}

/**
 * Product lines plus one tagged shipping line when delivery has a fee. Shipping
 * stays a line item (not `shipping_options`) because this app collects the
 * address itself; a tagged line keeps Stripe's `amount_total` equal to the
 * trusted order total without making Checkout collect the address again.
 */
export function buildCheckoutLineItems(currency: string, items: OrderItem[], shippingInCents = 0) {
	const productLineItems = items.map((item) => ({
		price_data: {
			currency,
			unit_amount: item.unitPriceInCents,
			product_data: {
				name: buildCheckoutLineItemName(item),
				metadata: {
					productId: item.productId,
					productVariantId: item.productVariantId,
					productName: item.name,
					productVariantLabel: item.productVariantLabel,
					sku: item.sku
				},
				images: item.imageUrl ? [item.imageUrl] : []
			}
		},
		quantity: item.quantity
	}));

	if (shippingInCents <= 0) return productLineItems;

	return [
		...productLineItems,
		{
			price_data: {
				currency,
				unit_amount: shippingInCents,
				product_data: {
					name: 'Shipping',
					metadata: { kind: 'shipping' }
				}
			},
			quantity: 1
		}
	];
}
