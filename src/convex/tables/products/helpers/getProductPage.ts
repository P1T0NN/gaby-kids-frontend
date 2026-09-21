// HELPERS
import { getPagination } from '../../../helpers/getPagination.js';
import { paginateSearch } from '../../../helpers/paginateSearch.js';

// CONFIG
import { CATEGORY_CONFIG } from '../../../../shared/features/categories/config.js';

// FILTERS
import {
	SHOP_AGE_GROUP_FILTER_KEY,
	SHOP_GENDER_FILTER_KEY
} from '../../../../shared/features/filters/data/shopAttributeFilters.js';

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
import type {
	ProductAgeGroup,
	ProductGender
} from '../../../../shared/features/products/types/productsTypes.js';
import type { ProductQuery } from '../../../../shared/features/products/types/productsTypes.js';

type Product = Doc<'products'>;
type SortOrder = 'asc' | 'desc';
type ProductAttributes = {
	status?: Product['status'];
	ageGroup?: ProductAgeGroup;
	gender?: ProductGender;
};

function getCategoryFilter(filters: ConvexFilter[]): string | undefined {
	const filter = filters.find((candidate) => candidate.field === 'category');
	if (!filter || filter.eq === undefined) return undefined;
	// SAFETY: buildProductFilter only creates category predicates from a string slug.
	return filter.eq as string;
}

function getAttributeFilter<T extends string>(filters: ConvexFilter[], key: string): T | undefined {
	const filter = filters.find((candidate) => candidate.field === key);
	if (!filter || filter.eq === undefined) return undefined;
	// SAFETY: buildProductFilter only creates attribute predicates from the shared attribute codes.
	return filter.eq as T;
}

function matchesProduct(
	product: Product,
	search: string | undefined,
	attributes: ProductAttributes
): boolean {
	if (attributes.status && product.status !== attributes.status) return false;
	if (attributes.ageGroup && product.ageGroup !== attributes.ageGroup) return false;
	if (attributes.gender && product.gender !== attributes.gender) return false;

	if (!search) return true;

	const searchTokens = search.trim().split(/\s+/);
	const searchTerm = (searchTokens[searchTokens.length - 1] || search).toLowerCase();
	return product.name.toLowerCase().includes(searchTerm);
}

/** Paginate an indexed products query, post-filtering the bounded scan for attributes and search. */
async function getScannedProductPage(
	productsQuery: ProductQuery,
	paginationOpts: PaginationOptions,
	search: string | undefined,
	attributes: ProductAttributes
): Promise<ConvexPaginatedPage<Product>> {
	const pageSize = normalizePageSize(paginationOpts.numItems);
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
			if (matchesProduct(product, search, attributes)) items.push(product);
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

export async function getProductPage(
	ctx: QueryCtx,
	paginationOpts: PaginationOptions,
	search: string | undefined,
	filters: ConvexFilter[],
	status?: Product['status'],
	order: SortOrder = 'desc'
): Promise<ConvexPaginatedPage<Awaited<ReturnType<typeof toProductResult>>>> {
	const categorySlug = getCategoryFilter(filters);
	const attributes: ProductAttributes = {
		status,
		ageGroup: getAttributeFilter<ProductAgeGroup>(filters, SHOP_AGE_GROUP_FILTER_KEY),
		gender: getAttributeFilter<ProductGender>(filters, SHOP_GENDER_FILTER_KEY)
	};
	const emptyPage: ConvexPaginatedPage<Product> = {
		items: [],
		nextCursor: null,
		hasNextPage: false,
		pageSize: normalizePageSize(paginationOpts.numItems)
	};

	if (categorySlug) {
		const category = await ctx.db
			.query('categories')
			.withIndex('by_slug', (query) => query.eq('slug', categorySlug))
			.unique();
		if (!category || category.status !== 'active') {
			return emptyPage;
		}

		const productsQuery = ctx.db
			.query('products')
			.withIndex('by_category_id', (query) => query.eq('categoryId', category._id))
			.order(order);
		const page = await getScannedProductPage(productsQuery, paginationOpts, search, attributes);
		return { ...page, items: await Promise.all(page.items.map(toProductResult)) };
	}

	if (attributes.ageGroup) {
		const productsQuery = ctx.db
			.query('products')
			.withIndex('by_age_group', (query) => query.eq('ageGroup', attributes.ageGroup))
			.order(order);
		const page = await getScannedProductPage(productsQuery, paginationOpts, search, attributes);
		return { ...page, items: await Promise.all(page.items.map(toProductResult)) };
	}

	if (attributes.gender) {
		const productsQuery = ctx.db
			.query('products')
			.withIndex('by_gender', (query) => query.eq('gender', attributes.gender))
			.order(order);
		const page = await getScannedProductPage(productsQuery, paginationOpts, search, attributes);
		return { ...page, items: await Promise.all(page.items.map(toProductResult)) };
	}

	// ponytail: non-indexable empty-array checks (upsells) scan at most 500 rows per page; add a denormalized boolean if this is reached regularly.
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
		: await getPagination(applyProductFilters(getProductQuery(ctx, status, order), filters), {
				paginationOpts: boundedOptions
			});

	return { ...page, items: await Promise.all(page.items.map(toProductResult)) };
}
