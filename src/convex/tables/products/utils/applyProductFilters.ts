// FILTERS
import {
	SHOP_AGE_GROUP_FILTER_KEY,
	SHOP_GENDER_FILTER_KEY
} from '../../../../shared/features/filters/data/shopAttributeFilters.js';

// TYPES
import type { ConvexFilter } from '../../../../shared/features/filters/types/filterTypesConvex.js';
import type { ProductQuery } from '../../../../shared/features/products/types/productsTypes.js';

export function applyProductFilters(query: ProductQuery, filters: ConvexFilter[]): ProductQuery {
	for (const filter of filters) {
		if (filter.field === 'hasUpsells') {
			query = query.filter((q) =>
				filter.eq ? q.neq(q.field('upsellProductIds'), []) : q.eq(q.field('upsellProductIds'), [])
			);
		}
		if (filter.field === SHOP_AGE_GROUP_FILTER_KEY && filter.eq !== undefined) {
			// SAFETY: buildProductFilter only creates attribute predicates from a string value.
			const ageGroup = filter.eq as string;
			query = query.filter((q) => q.eq(q.field('ageGroup'), ageGroup));
		}
		if (filter.field === SHOP_GENDER_FILTER_KEY && filter.eq !== undefined) {
			// SAFETY: buildProductFilter only creates attribute predicates from a string value.
			const gender = filter.eq as string;
			query = query.filter((q) => q.eq(q.field('gender'), gender));
		}
	}
	return query;
}
