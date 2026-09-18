// TYPES
import type { ProductVariantOptions } from '@/shared/features/productVariants/types/productVariantTypes.js';

/** The product variant matching exactly one value per option group, if it exists. */
export function findProductVariantByOptionValues<T extends ProductVariantOptions>(
	productVariants: readonly T[],
	optionValues: readonly string[]
): T | undefined {
	return productVariants.find(
		(productVariant) =>
			productVariant.options.length === optionValues.length &&
			productVariant.options.every(
				(option, optionIndex) => option.value.trim() === optionValues[optionIndex]?.trim()
			)
	);
}
