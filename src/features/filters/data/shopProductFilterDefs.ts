// LIBRARIES
import { m } from '@/lib/paraglide/messages';

// DATA
import { AGE_GROUP_LABELS, GENDER_LABELS } from '@/features/products/data/productLabels.js';

// CONFIG
import {
	SHOP_AGE_GROUP_FILTER_KEY,
	SHOP_GENDER_FILTER_KEY
} from '@/shared/features/filters/data/shopAttributeFilters.js';
import { SHOP_CATEGORY_FILTER_KEY } from '@/shared/features/filters/data/shopCategoryFilter.js';
import {
	PRODUCT_AGE_GROUPS,
	PRODUCT_GENDERS
} from '@/shared/features/products/data/productsData.js';
import { PRODUCTS_CONFIG } from '@/shared/features/products/config.js';

// TYPES
import type { FilterDef } from '@/shared/features/filters/types/filterTypes.js';

const CATEGORY_FILTER = {
	key: SHOP_CATEGORY_FILTER_KEY,
	get label() {
		return m['CategoriesFeature.CategoryOptions.category']();
	},
	// Options are loaded from the database by the `CategoryOptions` control;
	// only the inactive "All" sentinel is declared here.
	get options() {
		return [{ value: '', label: m['CategoriesFeature.CategoryOptions.allCategories']() }];
	}
} satisfies FilterDef;

const AGE_GROUP_FILTER = {
	key: SHOP_AGE_GROUP_FILTER_KEY,
	get label() {
		return m['ProductsFeature.ProductAttributes.ageGroup']();
	},
	get options() {
		return [
			{ value: '', label: m['ProductsFeature.ProductAttributes.allAgeGroups']() },
			...PRODUCT_AGE_GROUPS.map((ageGroup) => ({
				value: ageGroup,
				label: AGE_GROUP_LABELS[ageGroup]()
			}))
		];
	}
} satisfies FilterDef;

const GENDER_FILTER = {
	key: SHOP_GENDER_FILTER_KEY,
	get label() {
		return m['ProductsFeature.ProductAttributes.gender']();
	},
	get options() {
		return [
			{ value: '', label: m['ProductsFeature.ProductAttributes.allGenders']() },
			...PRODUCT_GENDERS.map((gender) => ({
				value: gender,
				label: GENDER_LABELS[gender]()
			}))
		];
	}
} satisfies FilterDef;

const SORT_FILTER = {
	key: 'sort',
	isSort: true,
	get label() {
		return m['ShopPage.sortLabel']();
	},
	get options() {
		return [
			{ value: '', label: m['ShopPage.newestFirst']() },
			{ value: 'asc', label: m['ShopPage.oldestFirst']() }
		];
	}
} satisfies FilterDef;

export const SHOP_PRODUCT_FILTER_DEFS = [
	CATEGORY_FILTER,
	...(PRODUCTS_CONFIG.HAS_AGE_GROUP ? [AGE_GROUP_FILTER] : []),
	...(PRODUCTS_CONFIG.HAS_GENDER ? [GENDER_FILTER] : []),
	SORT_FILTER
] satisfies FilterDef[];
