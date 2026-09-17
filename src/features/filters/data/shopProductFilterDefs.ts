// LIBRARIES
import { m } from '@/lib/paraglide/messages';

// CONFIG
import { SHOP_CATEGORY_FILTER_KEY } from '@/shared/features/filters/data/shopCategoryFilter.js';

// TYPES
import type { FilterDef } from '@/shared/features/filters/types/filterTypes.js';

export const SHOP_PRODUCT_FILTER_DEFS = [
	{
		key: SHOP_CATEGORY_FILTER_KEY,
		get label() {
			return m['CategoriesFeature.CategoryOptions.category']();
		},
		// Options are loaded from the database by the `CategoryOptions` control;
		// only the inactive "All" sentinel is declared here.
		get options() {
			return [{ value: '', label: m['CategoriesFeature.CategoryOptions.allCategories']() }];
		}
	},
	{
		key: 'photos',
		get label() {
			return m['ShopPage.imagesLabel']();
		},
		get options() {
			return [
				{ value: '', label: m['ShopPage.allImages']() },
				{ value: 'with', label: m['ShopPage.withImages']() },
				{ value: 'without', label: m['ShopPage.withoutImages']() }
			];
		}
	},
	{
		key: 'added',
		get label() {
			return m['ShopPage.addedLabel']();
		},
		get options() {
			return [
				{ value: '', label: m['ShopPage.anyTime']() },
				{ value: '30d', label: m['ShopPage.last30Days']() }
			];
		}
	}
] satisfies FilterDef[];
