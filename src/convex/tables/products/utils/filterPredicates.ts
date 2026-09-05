// FILTERS
import { SHOP_CATEGORY_FILTER_KEY } from '../../../../shared/features/filters/data/shopCategoryFilter.js';

// TYPES
import type { ConvexFilter } from '../../../../shared/features/filters/types/filterTypesConvex.js';

export function buildProductFilter(key: string, value: string): ConvexFilter | undefined {
	if (key === SHOP_CATEGORY_FILTER_KEY) return { field: 'category', eq: value };
	return undefined;
}
