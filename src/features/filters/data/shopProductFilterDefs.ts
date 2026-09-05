// LIBRARIES
import { m } from '@/lib/paraglide/messages';

// TYPES
import type { FilterDef } from '@/shared/features/filters/types/filterTypes.js';

export const SHOP_PRODUCT_FILTER_DEFS = [
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
