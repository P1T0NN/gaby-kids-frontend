// LIBRARIES
import { m } from '@/lib/paraglide/messages';

// DATA
import { GENDER_LABELS } from '@/features/products/data/productLabels.js';

// CONFIG
import { SHOP_GENDER_FILTER_KEY } from '@/shared/features/filters/data/shopAttributeFilters.js';
import { SHOP_CATEGORY_FILTER_KEY } from '@/shared/features/filters/data/shopCategoryFilter.js';
import { PRODUCT_GENDERS } from '@/shared/features/products/data/productsData.js';
import { PRODUCTS_CONFIG } from '@/shared/features/products/config.js';
import { PRODUCT_OPTION_FILTERS } from '@/shared/features/productVariants/data/productOptionFilters.js';

// UTILS
import { normalizeProductOptionText } from '@/shared/features/productVariants/utils/normalizeProductOptionText.js';

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

// Filter labels are UI text, translated per configured key with the config
// label as fallback; option names and values are admin data and stay
// untranslated.
type ProductOptionFilterLabels = Partial<
	Record<(typeof PRODUCT_OPTION_FILTERS)[number]['key'], () => string>
>;

const OPTION_FILTER_LABELS = {
	color: m['ProductsFeature.ProductOptionFilterLabels.color'],
	age: m['ProductsFeature.ProductOptionFilterLabels.age']
} satisfies ProductOptionFilterLabels;

// The filter offers exactly the values declared in the static config.
const OPTION_FILTERS = PRODUCT_OPTION_FILTERS.map(({ key, label, values }) => ({
	key,
	get label() {
		return OPTION_FILTER_LABELS[key]?.() ?? label;
	},
	get options() {
		return [
			{ value: '', label: m['ProductsFeature.ProductOptionFilterOptions.all']() },
			...values.map((value) => ({
				value: normalizeProductOptionText(value),
				label: value
			}))
		];
	}
})) satisfies FilterDef[];

export const SHOP_PRODUCT_FILTER_DEFS = [
	CATEGORY_FILTER,
	...(PRODUCTS_CONFIG.HAS_GENDER ? [GENDER_FILTER] : []),
	...OPTION_FILTERS
] satisfies FilterDef[];
