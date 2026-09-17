// TYPES
import type { ProductVariantOption } from '../types/productVariantTypes.js';

/** Customer-facing label for one product variant, e.g. "Red / M"; empty without options. */
export function getProductVariantLabel(options: readonly ProductVariantOption[]): string {
	return options.map((option) => option.value.trim()).join(' / ');
}
