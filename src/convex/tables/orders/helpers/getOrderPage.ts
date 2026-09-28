// HELPERS
import { getPagination } from '../../../helpers/getPagination.js';
import { getOrderQuery } from './getOrderQuery.js';

// TYPES
import type { Doc } from '../../../_generated/dataModel.js';
import type { QueryCtx } from '../../../_generated/server.js';
import type { ConvexPaginatedPage } from '../../../../shared/features/pagination/types/paginationTypesConvex.js';
import type { PaginationOptions } from 'convex/server';
import type { OrderFilters } from './readOrderFilters.js';

type Order = Doc<'orders'>;

/** Build the filtered orders page used by the admin orders list. */
export function getOrderPage({
	ctx,
	paginationOpts,
	filters
}: {
	ctx: QueryCtx;
	paginationOpts: PaginationOptions;
	filters: OrderFilters;
}): Promise<ConvexPaginatedPage<Order>> {
	return getPagination(getOrderQuery(ctx, filters), { paginationOpts });
}
