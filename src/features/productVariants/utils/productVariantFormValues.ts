// TYPES
import type { ProductVariantFormValue } from '@/shared/features/productVariants/types/productVariantTypes.js';

/** One blank product variant row matching the current option names. */
export function createProductVariantFormValue(
	productVariantOptionNames: readonly string[]
): ProductVariantFormValue {
	return {
		id: '',
		options: productVariantOptionNames.map((name) => ({ name, value: '' })),
		sku: '',
		imageKeys: [],
		price: '',
		discountedPrice: '',
		inventory: '0',
		reservedInventory: 0
	};
}

/** Major-unit input string for a stored price; empty when the price is absent. */
export function formatProductVariantFormPrice(priceInCents: number | undefined): string {
	if (priceInCents === undefined) return '';
	return (priceInCents / 100).toFixed(2);
}
