// HELPERS
import { getPagination } from '../../../helpers/getPagination.js';
import {
	getActiveCategoryId,
	getProductSearchTerm,
	type ProductAttributeFilters
} from '../../products/helpers/getProductPage.js';

// PAGINATION
import { normalizePageSize } from '../../../../shared/features/pagination/utils/normalizePageSize.js';

// MAPPERS
import { toProductResult } from '../../products/mappers/toProductResult.js';

// TYPES
import type { Doc } from '../../../_generated/dataModel.js';
import type { QueryCtx } from '../../../_generated/server.js';
import type {
	ConvexPaginatedPage,
	ConvexPaginatedSource
} from '../../../../shared/features/pagination/types/paginationTypesConvex.js';
import type { PaginationOptions } from 'convex/server';

type Product = Doc<'products'>;
type SortOrder = 'asc' | 'desc';

/**
 * Search and option selection share one indexed query before pagination.
 * Each selection key has one row per product, so pages need no deduplication.
 */
export async function getProductOptionPage({
	ctx,
	paginationOpts,
	optionKey,
	search,
	attributeFilters,
	status,
	order = 'desc'
}: {
	ctx: QueryCtx;
	paginationOpts: PaginationOptions;
	optionKey: string;
	search?: string;
	attributeFilters: ProductAttributeFilters;
	status: Product['status'];
	order?: SortOrder;
}): Promise<ConvexPaginatedPage<Awaited<ReturnType<typeof toProductResult>>>> {
	const pageSize = normalizePageSize(paginationOpts.numItems);
	const categoryId = attributeFilters.categorySlug
		? await getActiveCategoryId(ctx, attributeFilters.categorySlug)
		: undefined;
	if (attributeFilters.categorySlug && !categoryId) {
		return { items: [], nextCursor: null, hasNextPage: false, pageSize };
	}

	let source: ConvexPaginatedSource<Doc<'productOptionIndex'>>;
	if (search) {
		source = ctx.db.query('productOptionIndex').withSearchIndex('search_name', (query) => {
			let matches = query
				.search('name', getProductSearchTerm(search))
				.eq('status', status)
				.eq('optionKey', optionKey);
			if (categoryId) matches = matches.eq('categoryId', categoryId);
			if (attributeFilters.ageGroup) matches = matches.eq('ageGroup', attributeFilters.ageGroup);
			if (attributeFilters.gender) matches = matches.eq('gender', attributeFilters.gender);
			return matches;
		});
	} else {
		const baseQuery = categoryId
			? ctx.db
					.query('productOptionIndex')
					.withIndex('by_status_and_category_id_and_option_key_and_product_created_at', (query) =>
						query.eq('status', status).eq('categoryId', categoryId).eq('optionKey', optionKey)
					)
			: ctx.db
					.query('productOptionIndex')
					.withIndex('by_status_and_option_key_and_product_created_at', (query) =>
						query.eq('status', status).eq('optionKey', optionKey)
					);
		const orderedQuery = baseQuery.order(order);
		const gender = attributeFilters.gender;
		const ageGroup = attributeFilters.ageGroup;
		let filteredQuery = orderedQuery;
		if (gender) {
			filteredQuery = filteredQuery.filter((query) => query.eq(query.field('gender'), gender));
		}
		if (ageGroup) {
			filteredQuery = filteredQuery.filter((query) => query.eq(query.field('ageGroup'), ageGroup));
		}
		source = filteredQuery;
	}
	const page = await getPagination(source, { paginationOpts });

	const products = await Promise.all(page.items.map((row) => ctx.db.get(row.productId)));
	const items = products.filter((product): product is Product => product !== null);

	return { ...page, items: await Promise.all(items.map(toProductResult)) };
}
