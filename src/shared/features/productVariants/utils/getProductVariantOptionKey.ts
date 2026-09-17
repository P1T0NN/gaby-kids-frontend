// TYPES
import type { ProductVariantOption } from '../types/productVariantTypes.js';

/** Canonical, case-insensitive key for one product variant's option combination. */
export function getProductVariantOptionKey(options: readonly ProductVariantOption[]): string {
	return options
		.map((option) => `${option.name.trim().toLowerCase()}:${option.value.trim().toLowerCase()}`)
		.join('|');
}
