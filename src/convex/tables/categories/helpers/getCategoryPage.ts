// HELPERS
import { getPagination } from '../../../helpers/getPagination.js';
import { paginateSearch } from '../../../helpers/paginateSearch.js';

// TYPES
import type { Doc } from '../../../_generated/dataModel.js';
import type { QueryCtx } from '../../../_generated/server.js';
import type { ConvexPaginatedPage } from '../../../../shared/features/pagination/types/paginationTypesConvex.js';
import type { PaginationOptions } from 'convex/server';

type Category = Doc<'categories'>;
export type AdminCategory = Category;

export async function getCategoryPage(
	ctx: QueryCtx,
	paginationOpts: PaginationOptions,
	search: string | undefined
): Promise<ConvexPaginatedPage<AdminCategory>> {
	const page = search
		? await paginateSearch<Category>({
				ctx,
				search,
				filters: [],
				paginationOpts,
				buildQuery: ({ ctx, search }) =>
					ctx.db
						.query('categories')
						.withSearchIndex('search_name', (query) => query.search('name', search))
			})
		: await getPagination(ctx.db.query('categories').order('desc'), { paginationOpts });

	return page;
}
