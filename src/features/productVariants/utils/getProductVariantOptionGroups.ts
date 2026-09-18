// DATA
import { SIZE_VALUE_ORDER } from '@/shared/features/productVariants/data/productVariantsData.js';

// TYPES
import type {
	ProductVariantOptionGroup,
	ProductVariantOptions
} from '@/shared/features/productVariants/types/productVariantTypes.js';

const sizeRanks = new Map(SIZE_VALUE_ORDER.map((size, index) => [size, index]));

/** Known sizes first by scale, then numbers, then the original order (stable sort). */
function compareProductVariantOptionValues(left: string, right: string): number {
	const leftRank = sizeRanks.get(left.trim().toLowerCase());
	const rightRank = sizeRanks.get(right.trim().toLowerCase());
	if (leftRank !== undefined && rightRank !== undefined) return leftRank - rightRank;

	const leftNumber = Number(left.trim());
	const rightNumber = Number(right.trim());
	if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
		return leftNumber - rightNumber;
	}

	return 0;
}

/**
 * One group per product option with the unique values: known sizes and numbers
 * in natural order, all other values in product variant order.
 */
export function getProductVariantOptionGroups(
	productVariantOptionNames: readonly string[],
	productVariants: readonly ProductVariantOptions[]
): ProductVariantOptionGroup[] {
	return productVariantOptionNames.map((name, optionIndex) => {
		const values: string[] = [];

		for (const productVariant of productVariants) {
			const value = productVariant.options[optionIndex]?.value.trim();
			if (value && !values.includes(value)) values.push(value);
		}

		return { name, values: values.sort(compareProductVariantOptionValues) };
	});
}
