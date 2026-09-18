// FILTERS
import { SHOP_CATEGORY_FILTER_KEY } from '../../../../shared/features/filters/data/shopCategoryFilter.js';

// UTILS
import { eqColumn } from '../../../../shared/features/filters/utils/commonPredicatesConvex.js';

// TYPES
import type { ConvexFilter } from '../../../../shared/features/filters/types/filterTypesConvex.js';

const categoryPredicate = eqColumn('category');

export function buildProductFilter(key: string, value: string): ConvexFilter | undefined {
	return key === SHOP_CATEGORY_FILTER_KEY ? categoryPredicate(value) : undefined;
}
