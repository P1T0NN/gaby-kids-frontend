// CONFIG
import { ORDER_CONFIG } from '../../orders/config.js';

// TYPES
import type { Doc } from '../../../../convex/_generated/dataModel.js';

// UTILS
import { calculateShippingInCents } from '../../orders/utils/calculateShippingInCents.js';
import { hasInvalidOrderItems } from '../../orders/utils/hasInvalidOrderItems.js';

type CheckoutSnapshotItem = Pick<
	Doc<'checkoutReservations'>['items'][number],
	'productVariantId' | 'name' | 'unitPriceInCents' | 'quantity'
>;

type CheckoutSnapshot = {
	items: readonly CheckoutSnapshotItem[];
	fulfillmentMethod: 'delivery' | 'pickup';
	subtotalInCents: number;
	shippingInCents: number;
	totalInCents: number;
};

export function hasInvalidCheckoutSnapshot(
	checkout: CheckoutSnapshot,
	subtotalInCents: number
): boolean {
	return (
		hasInvalidOrderItems(checkout.items) ||
		!Number.isSafeInteger(subtotalInCents) ||
		subtotalInCents <= 0 ||
		subtotalInCents !== checkout.subtotalInCents ||
		!Number.isSafeInteger(checkout.shippingInCents) ||
		checkout.shippingInCents < 0 ||
		checkout.shippingInCents !==
			calculateShippingInCents(subtotalInCents, checkout.fulfillmentMethod) ||
		checkout.totalInCents !== subtotalInCents + checkout.shippingInCents ||
		new Set(checkout.items.map((item) => item.productVariantId)).size !== checkout.items.length ||
		checkout.items.some((item) => !item.name.trim() || item.quantity > ORDER_CONFIG.maxQuantity)
	);
}
