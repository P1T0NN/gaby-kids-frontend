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

export function buildCheckoutLineItems(currency: string, items: OrderItem[]) {
	return items.map((item) => ({
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
}
