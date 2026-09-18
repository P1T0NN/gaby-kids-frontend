// UTILS
import { findProductVariantByOptionValues } from './findProductVariantByOptionValues.js';
import { getProductVariantAvailability } from './getProductVariantAvailability.js';

// TYPES
import type { ProductVariantOptionCandidate } from '@/shared/features/productVariants/types/productVariantTypes.js';

function isProductVariantAvailable(
	productVariant: ProductVariantOptionCandidate,
	trackInventory: boolean
): boolean {
	const availability = getProductVariantAvailability({ trackInventory }, productVariant);
	return availability.type === 'available' || availability.type === 'unlimited';
}

function matchesSelectedPrecedingValues(
	productVariant: ProductVariantOptionCandidate,
	groupIndex: number,
	selectedOptionValues: readonly string[]
): boolean {
	for (let index = 0; index < groupIndex; index++) {
		if ((productVariant.options[index]?.value ?? '').trim() !== selectedOptionValues[index]) {
			return false;
		}
	}
	return true;
}

function countMatchingOptionValues(
	productVariant: ProductVariantOptionCandidate,
	groupIndex: number,
	selectedOptionValues: readonly string[]
): number {
	let matches = 0;
	for (const [index, selectedValue] of selectedOptionValues.entries()) {
		if (
			index !== groupIndex &&
			(productVariant.options[index]?.value ?? '').trim() === selectedValue
		)
			matches++;
	}
	return matches;
}

function pickBestMatch<T extends ProductVariantOptionCandidate>(
	candidates: readonly T[],
	groupIndex: number,
	selectedOptionValues: readonly string[]
): T {
	return candidates.reduce((best, candidate) =>
		countMatchingOptionValues(candidate, groupIndex, selectedOptionValues) >
		countMatchingOptionValues(best, groupIndex, selectedOptionValues)
			? candidate
			: best
	);
}

/**
 * The product variant a value click should land on: the exact combination when
 * it is available, otherwise an available variant that keeps the selected
 * values of the preceding groups and adjusts only the later ones. A sold-out
 * exact combination is returned as-is, so it renders as unavailable instead of
 * silently switching a value the customer already chose.
 */
export function findProductVariantForOptionValue<T extends ProductVariantOptionCandidate>(
	groupIndex: number,
	value: string,
	context: {
		productVariants: readonly T[];
		selectedOptionValues: readonly string[];
		trackInventory: boolean;
	}
): T | undefined {
	const { productVariants, selectedOptionValues, trackInventory } = context;
	const candidateOptionValues = selectedOptionValues.map((selectedValue, index) =>
		index === groupIndex ? value : selectedValue
	);
	const candidates = productVariants.filter(
		(productVariant) => (productVariant.options[groupIndex]?.value ?? '').trim() === value
	);
	if (candidates.length === 0) return undefined;

	// A click may adjust the values after this group, never the ones before it.
	const parentCompatibleCandidates = candidates.filter((productVariant) =>
		matchesSelectedPrecedingValues(productVariant, groupIndex, selectedOptionValues)
	);
	if (parentCompatibleCandidates.length === 0) {
		return pickBestMatch(candidates, groupIndex, selectedOptionValues);
	}

	const exactProductVariant = findProductVariantByOptionValues(
		parentCompatibleCandidates,
		candidateOptionValues
	);
	if (exactProductVariant && isProductVariantAvailable(exactProductVariant, trackInventory)) {
		return exactProductVariant;
	}

	const availableCandidates = parentCompatibleCandidates.filter((productVariant) =>
		isProductVariantAvailable(productVariant, trackInventory)
	);
	if (availableCandidates.length > 0) {
		return pickBestMatch(availableCandidates, groupIndex, selectedOptionValues);
	}
	return (
		exactProductVariant ??
		pickBestMatch(parentCompatibleCandidates, groupIndex, selectedOptionValues)
	);
}
