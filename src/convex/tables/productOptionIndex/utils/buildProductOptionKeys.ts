// DATA
import { PRODUCT_OPTION_FILTERS } from '../../../../shared/features/productVariants/data/productOptionFilters.js';

// UTILS
import { normalizeProductOptionText } from '../../../../shared/features/productVariants/utils/normalizeProductOptionText.js';

// TYPES
import type { ProductVariantOption } from '../../../../shared/features/productVariants/types/productVariantTypes.js';

export type ProductOptionPair = {
	optionName: string;
	optionValue: string;
};

const CONFIGURED_OPTION_NAMES = new Set(
	PRODUCT_OPTION_FILTERS.map((filter) => normalizeProductOptionText(filter.optionName))
);

function compareProductOptionPairs(left: ProductOptionPair, right: ProductOptionPair): number {
	if (left.optionName === right.optionName) {
		return left.optionValue < right.optionValue ? -1 : left.optionValue > right.optionValue ? 1 : 0;
	}
	return left.optionName < right.optionName ? -1 : 1;
}

/** Canonical, deduplicated `name:value` pairs of one variant, restricted to configured filters. */
function getConfiguredProductOptionPairs(
	options: readonly ProductVariantOption[]
): ProductOptionPair[] {
	const pairs = new Map<string, ProductOptionPair>();

	for (const option of options) {
		const optionName = normalizeProductOptionText(option.name);
		const optionValue = normalizeProductOptionText(option.value);
		if (!CONFIGURED_OPTION_NAMES.has(optionName) || optionValue.length === 0) continue;

		pairs.set(`${optionName}:${optionValue}`, { optionName, optionValue });
	}

	return [...pairs.values()];
}

/** The canonical selection key of one option combination: sorted pairs joined `name:value`. */
export function buildProductOptionSelectionKey(pairs: readonly ProductOptionPair[]): string {
	return [...pairs]
		.sort(compareProductOptionPairs)
		.map((pair) => `${pair.optionName}:${pair.optionValue}`)
		.join('|');
}

/**
 * One selection key per non-empty subset of every variant's configured pairs,
 * deduplicated per product and sorted. A Red/L variant produces `color:red`,
 * `size:l`, and `color:red|size:l`; unconfigured options contribute nothing.
 */
export function buildProductOptionKeys(
	variants: readonly { options: readonly ProductVariantOption[] }[]
): string[] {
	const keys = new Set<string>();

	for (const variant of variants) {
		const pairs = getConfiguredProductOptionPairs(variant.options).sort(compareProductOptionPairs);
		for (let mask = 1; mask < 1 << pairs.length; mask += 1) {
			keys.add(
				buildProductOptionSelectionKey(pairs.filter((_, index) => (mask & (1 << index)) !== 0))
			);
		}
	}

	return [...keys].sort();
}

/** Recover the canonical pairs a stored selection key was built from. */
export function parseProductOptionKey(optionKey: string): ProductOptionPair[] {
	return optionKey.split('|').flatMap((segment) => {
		const separator = segment.indexOf(':');
		if (separator <= 0 || separator === segment.length - 1) return [];

		return [{ optionName: segment.slice(0, separator), optionValue: segment.slice(separator + 1) }];
	});
}
