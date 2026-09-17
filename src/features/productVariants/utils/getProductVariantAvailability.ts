// UTILS
import { getProductAvailability } from '@/shared/features/products/utils/getProductAvailability.js';

// TYPES
import type { ProductAvailability } from '@/shared/features/products/types/productsTypes.js';
import type { Doc } from '@convex/_generated/dataModel.js';

/** Availability of one product variant, using the product's inventory tracking switch. */
export function getProductVariantAvailability(
	product: Pick<Doc<'products'>, 'trackInventory'>,
	productVariant: Pick<Doc<'productVariants'>, 'inventory' | 'reservedInventory'>
): ProductAvailability {
	return getProductAvailability({
		trackInventory: product.trackInventory,
		inventory: productVariant.inventory,
		reservedInventory: productVariant.reservedInventory
	});
}
