// DATA
import { PRODUCT_OPTION_FILTERS } from '../../../../shared/features/productVariants/data/productOptionFilters.js';

// UTILS
import { normalizeProductOptionText } from '../../../../shared/features/productVariants/utils/normalizeProductOptionText.js';

// HELPERS
import {
	buildProductOptionSelectionKey,
	type ProductOptionPair
} from '../utils/buildProductOptionKeys.js';

/** Configured values per filter; values outside this list are ignored. */
const CONFIGURED_OPTION_VALUES = new Map(
	PRODUCT_OPTION_FILTERS.map((filter) => [
		filter.key,
		new Set(filter.values.map(normalizeProductOptionText))
	])
);

/** One canonical selection key for the active option-filter values, `undefined` when none. */
export function resolveProductOptionSelection(filters: Record<string, string>): string | undefined {
	const pairs: ProductOptionPair[] = [];

	for (const filter of PRODUCT_OPTION_FILTERS) {
		const optionValue = normalizeProductOptionText(filters[filter.key] ?? '');
		if (optionValue.length === 0 || !CONFIGURED_OPTION_VALUES.get(filter.key)?.has(optionValue)) {
			continue;
		}

		pairs.push({ optionName: normalizeProductOptionText(filter.optionName), optionValue });
	}

	return pairs.length === 0 ? undefined : buildProductOptionSelectionKey(pairs);
}
