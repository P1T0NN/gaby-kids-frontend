// TYPES
import type { ProductVariantFormValue } from '@/shared/features/productVariants/types/productVariantTypes.js';

/** One blank product variant row matching the current option names. */
export function createProductVariantFormValue(
	productVariantOptionNames: readonly string[]
): ProductVariantFormValue {
	return {
		id: undefined,
		options: productVariantOptionNames.map((name) => ({ name, value: '' })),
		sku: '',
		skuOverridden: false,
		imageKeys: [],
		priceInCents: undefined,
		compareAtPriceInCents: undefined,
		inventory: 0,
		reservedInventory: 0
	};
}
