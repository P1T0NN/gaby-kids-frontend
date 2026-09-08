// TYPES
import type { ConvexFilter } from '../../../../shared/features/filters/types/filterTypesConvex.js';
import type { ProductQuery } from '../../../../shared/features/products/types/productsTypes.js';

export function applyProductFilters(query: ProductQuery, filters: ConvexFilter[]): ProductQuery {
	for (const filter of filters) {
		if (filter.field === 'hasUpsells') {
			query = query.filter((q) => {
				const noUpsells = q.or(
					q.eq(q.field('upsellProductIds'), undefined),
					q.eq(q.field('upsellProductIds'), [])
				);
				return filter.eq ? q.not(noUpsells) : noUpsells;
			});
		}
		if (filter.field === 'hasImages') {
			query = query.filter((q) => {
				const noImages = q.or(
					q.eq(q.field('imageKeys'), []),
					q.and(q.eq(q.field('imageKeys'), undefined), q.eq(q.field('images'), []))
				);
				return filter.eq ? q.not(noImages) : noImages;
			});
		}
		if (filter.field === '_creationTime' && filter.gte !== undefined) {
			const since = filter.gte;
			query = query.filter((q) => q.gte(q.field('_creationTime'), since));
		}
	}
	return query;
}
