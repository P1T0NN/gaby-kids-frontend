// HELPERS
import { getPagination } from '../../../helpers/getPagination.js';
import { paginateSearch } from '../../../helpers/paginateSearch.js';

// MAPPERS
import { toCategoryResult } from '../mappers/toCategoryResult.js';

// TYPES
import type { Infer } from 'convex/values';
import type { Doc } from '../../../_generated/dataModel.js';
import type { QueryCtx } from '../../../_generated/server.js';
import type { categoryResult } from '../validators/categoryValidators.js';
import type { ConvexPaginatedPage } from '../../../../shared/features/pagination/types/paginationTypesConvex.js';
import type { PaginationOptions } from 'convex/server';

type Category = Doc<'categories'>;
type CategoryResult = Infer<typeof categoryResult>;
export type AdminCategory = CategoryResult;

export async function getCategoryPage({
	ctx,
	paginationOpts,
	search
}: {
	ctx: QueryCtx;
	paginationOpts: PaginationOptions;
	search?: string;
}): Promise<ConvexPaginatedPage<AdminCategory>> {
	const page = search
		? await paginateSearch<Category>({
				ctx,
				search,
				paginationOpts,
				buildQuery: ({ ctx, search }) =>
					ctx.db
						.query('categories')
						.withSearchIndex('search_name', (query) => query.search('name', search))
			})
		: await getPagination(ctx.db.query('categories').order('desc'), { paginationOpts });

	return { ...page, items: await Promise.all(page.items.map(toCategoryResult)) };
}
