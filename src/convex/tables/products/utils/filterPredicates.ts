// FILTERS
import {
	SHOP_AGE_GROUP_FILTER_KEY,
	SHOP_GENDER_FILTER_KEY
} from '../../../../shared/features/filters/data/shopAttributeFilters.js';
import { SHOP_CATEGORY_FILTER_KEY } from '../../../../shared/features/filters/data/shopCategoryFilter.js';

// UTILS
import { eqColumn } from '../../../../shared/features/filters/utils/commonPredicatesConvex.js';

// TYPES
import type { ConvexFilter } from '../../../../shared/features/filters/types/filterTypesConvex.js';

const categoryPredicate = eqColumn('category');
const ageGroupPredicate = eqColumn(SHOP_AGE_GROUP_FILTER_KEY);
const genderPredicate = eqColumn(SHOP_GENDER_FILTER_KEY);

export function buildProductFilter(key: string, value: string): ConvexFilter | undefined {
	if (key === SHOP_CATEGORY_FILTER_KEY) return categoryPredicate(value);
	if (key === SHOP_AGE_GROUP_FILTER_KEY) return ageGroupPredicate(value);
	if (key === SHOP_GENDER_FILTER_KEY) return genderPredicate(value);
	return undefined;
}
