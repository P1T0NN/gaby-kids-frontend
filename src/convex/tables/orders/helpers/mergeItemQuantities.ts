// LIBRARIES
import { ConvexError } from 'convex/values';

// CONFIG
import { ORDER_CONFIG } from '../../../../shared/features/orders/config.js';

// TYPES
import type { Id } from '../../../_generated/dataModel.js';
import type { BackendErrorData } from '../../../../shared/types/types.js';

type OrderItemInput = { productVariantId: Id<'productVariants'>; quantity: number };

/** Merge duplicate lines and reject quantities above the per-product-variant limit. */
export function mergeItemQuantities(items: OrderItemInput[]): Map<Id<'productVariants'>, number> {
	const quantities = new Map<Id<'productVariants'>, number>();

	for (const item of items) {
		const quantity = (quantities.get(item.productVariantId) ?? 0) + item.quantity;
		if (quantity > ORDER_CONFIG.maxQuantity) {
			throw new ConvexError<BackendErrorData>({ code: 'INVALID_ORDER_DATA' });
		}
		quantities.set(item.productVariantId, quantity);
	}

	return quantities;
}
