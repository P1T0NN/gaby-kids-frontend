// TYPES
import type { Doc } from '../../_generated/dataModel.js';

type OrderItem = Pick<Doc<'orderItems'>, 'productId' | 'name' | 'unitPriceInCents' | 'quantity'> & {
	imageUrl?: string;
};

export function buildCheckoutLineItems(currency: string, items: OrderItem[]) {
	return items.map((item) => ({
		price_data: {
			currency,
			unit_amount: item.unitPriceInCents,
			product_data: {
				name: item.name,
				metadata: { productId: item.productId },
				images: item.imageUrl ? [item.imageUrl] : []
			}
		},
		quantity: item.quantity
	}));
}
