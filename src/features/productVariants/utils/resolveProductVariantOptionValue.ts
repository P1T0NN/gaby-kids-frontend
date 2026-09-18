// UTILS
import { findProductVariantForOptionValue } from './findProductVariantForOptionValue.js';
import { getProductVariantAvailability } from './getProductVariantAvailability.js';
import { isProductVariantOptionValueCompatible } from './isProductVariantOptionValueCompatible.js';

// TYPES
import type {
	ProductVariantOptionCandidate,
	ProductVariantOptionResolution,
	ProductVariantOptionUnavailableReason
} from '@/shared/features/productVariants/types/productVariantTypes.js';

/** Why a value cannot be picked, or `undefined` when it can. */
function getUnavailableReason<T extends ProductVariantOptionCandidate>(
	groupIndex: number,
	value: string,
	context: {
		productVariant: T | undefined;
		productVariants: readonly T[];
		selectedOptionValues: readonly string[];
		trackInventory: boolean;
	}
): ProductVariantOptionUnavailableReason | undefined {
	const { productVariant, productVariants, selectedOptionValues, trackInventory } = context;
	if (
		!isProductVariantOptionValueCompatible(groupIndex, value, productVariants, selectedOptionValues)
	) {
		return 'incompatible';
	}
	if (!productVariant) return undefined;

	const availability = getProductVariantAvailability({ trackInventory }, productVariant);
	if (availability.type === 'sold_out') return 'sold_out';
	if (availability.type === 'temporarily_unavailable') return 'temporarily_unavailable';
	return undefined;
}

/**
 * The product variant a value click should land on and why the value cannot be
 * picked, if it cannot. The reason reuses the variant found here, so the two
 * parts never scan the product variants twice.
 */
export function resolveProductVariantOptionValue<T extends ProductVariantOptionCandidate>(
	groupIndex: number,
	value: string,
	context: {
		productVariants: readonly T[];
		selectedOptionValues: readonly string[];
		trackInventory: boolean;
	}
): ProductVariantOptionResolution<T> {
	const productVariant = findProductVariantForOptionValue(groupIndex, value, context);
	const unavailableReason = getUnavailableReason(groupIndex, value, { ...context, productVariant });
	return { productVariant, unavailableReason };
}
