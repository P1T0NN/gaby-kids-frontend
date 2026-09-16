// TYPES
import type { Doc } from '../../../../convex/_generated/dataModel.js';

export function hasInvalidProductInventory(
	product: Doc<'products'> | null,
	quantity: number
): boolean {
	return (
		!product ||
		!product.trackInventory ||
		!Number.isSafeInteger(product.inventory) ||
		!Number.isSafeInteger(product.reservedInventory) ||
		product.inventory < quantity ||
		product.reservedInventory < quantity
	);
}
