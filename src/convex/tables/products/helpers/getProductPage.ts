// HELPERS
import { getPagination } from '../../../helpers/getPagination.js';
import { paginateSearch } from '../../../helpers/paginateSearch.js';

// CONFIG
import { CATEGORY_CONFIG } from '../../../../shared/features/categories/config.js';

// PAGINATION
import { normalizePageSize } from '../../../../shared/features/pagination/utils/normalizePageSize.js';

// MAPPERS
import { toProductResult } from '../mappers/toProductResult.js';
import { applyProductFilters } from '../utils/applyProductFilters.js';

// TYPES
import type { Doc } from '../../../_generated/dataModel.js';
import type { QueryCtx } from '../../../_generated/server.js';
import type { ConvexFilter } from '../../../../shared/features/filters/types/filterTypesConvex.js';
import type { ConvexPaginatedPage } from '../../../../shared/features/pagination/types/paginationTypesConvex.js';
import type { PaginationOptions } from 'convex/server';
import type { ProductQuery } from '../../../../shared/features/products/types/productsTypes.js';

type Product = Doc<'products'>;

function getCategoryFilter(filters: ConvexFilter[]): string | undefined {
	const filter = filters.find((candidate) => candidate.field === 'category');
	if (!filter || filter.eq === undefined) return undefined;
	// SAFETY: buildProductFilter only creates category predicates from a string slug.
	return filter.eq as string;
}

function matchesProduct(
	product: Product,
	search: string | undefined,
	filters: ConvexFilter[],
	status?: Product['status']
): boolean {
	if (status && product.status !== status) return false;
	for (const filter of filters) {
		const hasImages = (product.imageKeys ?? product.images).length > 0;
		if (filter.field === 'hasImages' && hasImages !== filter.eq) return false;
		if (
			filter.field === '_creationTime' &&
			filter.gte !== undefined &&
			product._creationTime < filter.gte
		)
			return false;
	}

	if (!search) return true;

	const searchTokens = search.trim().split(/\s+/);
	const searchTerm = (searchTokens[searchTokens.length - 1] || search).toLowerCase();
	return product.name.toLowerCase().includes(searchTerm);
}

async function getCategoryProductPage(
	ctx: QueryCtx,
	paginationOpts: PaginationOptions,
	search: string | undefined,
	categorySlug: string,
	filters: ConvexFilter[],
	status?: Product['status']
): Promise<ConvexPaginatedPage<Product>> {
	const category = await ctx.db
		.query('categories')
		.withIndex('by_slug', (query) => query.eq('slug', categorySlug))
		.unique();
	if (!category || category.status !== 'active') {
		return {
			items: [],
			nextCursor: null,
			hasNextPage: false,
			pageSize: normalizePageSize(paginationOpts.numItems)
		};
	}

	const pageSize = normalizePageSize(paginationOpts.numItems);
	const productsQuery = ctx.db
		.query('products')
		.withIndex('by_category_id', (query) => query.eq('categoryId', category._id))
		.order('desc');
	const items: Product[] = [];
	let cursor = paginationOpts.cursor ?? null;
	let isDone = false;
	let scanned = 0;

	// ponytail: scan at most 500 products per request; add a listing projection if this ceiling is reached regularly.
	while (!isDone && items.length < pageSize && scanned < CATEGORY_CONFIG.maxCategoryProductScan) {
		const result = await productsQuery.paginate({
			...paginationOpts,
			cursor,
			numItems: Math.min(pageSize, CATEGORY_CONFIG.maxCategoryProductScan - scanned)
		});
		scanned += result.page.length;
		isDone = result.isDone;
		cursor = result.continueCursor;

		for (const product of result.page) {
			if (matchesProduct(product, search, filters, status)) items.push(product);
			if (items.length === pageSize) break;
		}
	}

	return {
		items,
		nextCursor: isDone ? null : cursor,
		hasNextPage: !isDone,
		pageSize
	};
}

function getProductQuery(
	ctx: QueryCtx,
	filters: ConvexFilter[],
	status?: Product['status']
): ProductQuery {
	const since = filters.find((filter) => filter.field === '_creationTime')?.gte;
	if (status) {
		return ctx.db
			.query('products')
			.withIndex('by_status', (query) => {
				const range = query.eq('status', status);
				return since === undefined ? range : range.gte('_creationTime', since);
			})
			.order('desc');
	}
	return ctx.db
		.query('products')
		.withIndex('by_creation_time', (query) =>
			since === undefined ? query : query.gte('_creationTime', since)
		)
		.order('desc');
}

export async function getProductPage(
	ctx: QueryCtx,
	paginationOpts: PaginationOptions,
	search: string | undefined,
	filters: ConvexFilter[],
	status?: Product['status']
): Promise<ConvexPaginatedPage<Awaited<ReturnType<typeof toProductResult>>>> {
	const categorySlug = getCategoryFilter(filters);
	if (categorySlug) {
		const page = await getCategoryProductPage(
			ctx,
			paginationOpts,
			search,
			categorySlug,
			filters,
			status
		);
		return { ...page, items: await Promise.all(page.items.map(toProductResult)) };
	}

	// ponytail: non-indexable photo checks scan at most 500 rows per page; add an indexed hasImages field if the catalogue outgrows this.
	const boundedOptions = {
		...paginationOpts,
		maximumRowsRead: Math.min(paginationOpts.maximumRowsRead ?? 500, 500)
	};
	const page = search
		? await paginateSearch<Product>({
				ctx,
				search,
				filters,
				paginationOpts: boundedOptions,
				buildQuery: ({ ctx, search }) => {
					const query = ctx.db
						.query('products')
						.withSearchIndex('search_name', (query) =>
							status
								? query.search('name', search).eq('status', status)
								: query.search('name', search)
						);
					return applyProductFilters(query, filters);
				}
			})
		: await getPagination(applyProductFilters(getProductQuery(ctx, filters, status), filters), {
				paginationOpts: boundedOptions
			});

	return { ...page, items: await Promise.all(page.items.map(toProductResult)) };
}
