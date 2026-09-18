// TYPES
import type { ProductVariantOptions } from '@/shared/features/productVariants/types/productVariantTypes.js';

/** Whether any product variant pairs the value with the selected preceding option values. */
export function isProductVariantOptionValueCompatible(
	groupIndex: number,
	value: string,
	productVariants: readonly ProductVariantOptions[],
	selectedOptionValues: readonly string[]
): boolean {
	if (groupIndex === 0) return true;
	return productVariants.some(
		(productVariant) =>
			(productVariant.options[groupIndex]?.value ?? '').trim() === value &&
			selectedOptionValues
				.slice(0, groupIndex)
				.every(
					(selectedValue, index) =>
						(productVariant.options[index]?.value ?? '').trim() === selectedValue
				)
	);
}
