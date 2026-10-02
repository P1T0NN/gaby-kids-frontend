// HELPERS
import { getPagination } from '../../../helpers/getPagination.js';

// MAPPERS
import { toProductResult } from '../mappers/toProductResult.js';

// TYPES
import type { Doc, Id } from '../../../_generated/dataModel.js';
import type { QueryCtx } from '../../../_generated/server.js';
import type { ConvexPaginatedPage } from '../../../../shared/features/pagination/types/paginationTypesConvex.js';
import type { PaginationOptions } from 'convex/server';
import type { ProductQuery } from '../../../../shared/features/products/types/productsTypes.js';

type Product = Doc<'products'>;
type SortOrder = 'asc' | 'desc';

export type ProductAttributeFilters = {
	categorySlug?: string;
	ageGroup?: Product['ageGroup'];
	gender?: Product['gender'];
};

/** Preserve the catalog's final-token prefix search for both product indexes. */
export function getProductSearchTerm(search: string): string {
	return search.trim().split(/\s+/).at(-1) || search;
}

/** Resolve an active category slug to its id; missing or archived slugs match nothing. */
export async function getActiveCategoryId(
	ctx: QueryCtx,
	slug: string
): Promise<Id<'categories'> | undefined> {
	const category = await ctx.db
		.query('categories')
		.withIndex('by_slug', (query) => query.eq('slug', slug))
		.unique();
	return category?.status === 'active' ? category._id : undefined;
}

function getProductQuery(
	ctx: QueryCtx,
	status: Product['status'] | undefined,
	order: SortOrder
): ProductQuery {
	if (status) {
		return ctx.db
			.query('products')
			.withIndex('by_status', (query) => query.eq('status', status))
			.order(order);
	}
	return ctx.db
		.query('products')
		.withIndex('by_creation_time', (query) => query)
		.order(order);
}

/**
 * Convex allows only a single `.paginate()` per function execution, so every
 * predicate filters inside the query. At this catalog scale the attribute
 * filters scan the indexed status range, which stays under Convex's per-query
 * read limits; add composite index variants only if a catalog reaches tens of
 * thousands of products.
 */
function applyProductAttributeFilters(
	query: ProductQuery,
	attributeFilters: ProductAttributeFilters,
	hasUpsells: boolean
): ProductQuery {
	if (attributeFilters.ageGroup) {
		const ageGroup = attributeFilters.ageGroup;
		query = query.filter((q) => q.eq(q.field('ageGroup'), ageGroup));
	}
	if (attributeFilters.gender) {
		const gender = attributeFilters.gender;
		query = query.filter((q) => q.eq(q.field('gender'), gender));
	}
	if (hasUpsells) {
		query = query.filter((q) => q.neq(q.field('upsellProductIds'), []));
	}
	return query;
}

export async function getProductPage({
	ctx,
	paginationOpts,
	search,
	attributeFilters,
	status,
	order = 'desc',
	hasUpsells = false
}: {
	ctx: QueryCtx;
	paginationOpts: PaginationOptions;
	search: string | undefined;
	attributeFilters: ProductAttributeFilters;
	status?: Product['status'];
	order?: SortOrder;
	hasUpsells?: boolean;
}): Promise<ConvexPaginatedPage<Awaited<ReturnType<typeof toProductResult>>>> {
	let baseQuery: ProductQuery;
	if (search) {
		baseQuery = ctx.db.query('products').withSearchIndex('search_name', (query) => {
			let matches = query.search('name', getProductSearchTerm(search));
			if (status) matches = matches.eq('status', status);
			if (attributeFilters.ageGroup) matches = matches.eq('ageGroup', attributeFilters.ageGroup);
			if (attributeFilters.gender) matches = matches.eq('gender', attributeFilters.gender);
			return matches;
		});
	} else {
		baseQuery = getProductQuery(ctx, status, order);
	}

	const page = await getPagination(
		applyProductAttributeFilters(baseQuery, search ? {} : attributeFilters, hasUpsells),
		{ paginationOpts }
	);

	return { ...page, items: await Promise.all(page.items.map(toProductResult)) };
}
