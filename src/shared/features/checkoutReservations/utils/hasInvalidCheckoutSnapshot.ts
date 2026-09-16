// CONFIG
import { ORDER_CONFIG } from '../../orders/config.js';

// TYPES
import type { Doc } from '../../../../convex/_generated/dataModel.js';

// UTILS
import { hasInvalidOrderItems } from '../../orders/utils/hasInvalidOrderItems.js';

type CheckoutSnapshotItem = Pick<
	Doc<'checkoutReservations'>['items'][number],
	'productId' | 'name' | 'unitPriceInCents' | 'quantity'
>;

type CheckoutSnapshot = {
	items: readonly CheckoutSnapshotItem[];
	totalInCents: number;
};

export function hasInvalidCheckoutSnapshot(
	checkout: CheckoutSnapshot,
	totalInCents: number
): boolean {
	return (
		hasInvalidOrderItems(checkout.items) ||
		!Number.isSafeInteger(totalInCents) ||
		totalInCents <= 0 ||
		totalInCents !== checkout.totalInCents ||
		new Set(checkout.items.map((item) => item.productId)).size !== checkout.items.length ||
		checkout.items.some((item) => !item.name.trim() || item.quantity > ORDER_CONFIG.maxQuantity)
	);
}
