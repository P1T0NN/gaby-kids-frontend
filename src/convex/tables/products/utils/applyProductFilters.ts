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
	}
	return query;
}
