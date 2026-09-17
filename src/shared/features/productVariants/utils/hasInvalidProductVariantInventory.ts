// TYPES
import type { Doc } from '../../../../convex/_generated/dataModel.js';

/** Reject product variant inventory that cannot fulfil the paid quantity. */
export function hasInvalidProductVariantInventory(
	productVariant: Doc<'productVariants'> | null,
	quantity: number
): boolean {
	return (
		!productVariant ||
		!Number.isSafeInteger(productVariant.inventory) ||
		!Number.isSafeInteger(productVariant.reservedInventory) ||
		productVariant.inventory < quantity ||
		productVariant.reservedInventory < quantity
	);
}
