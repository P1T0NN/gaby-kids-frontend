// HELPERS
import { getPagination } from '../../../helpers/getPagination.js';

// TYPES
import type { Doc } from '../../../_generated/dataModel.js';
import type { QueryCtx } from '../../../_generated/server.js';
import type { ConvexPaginatedPage } from '../../../../shared/features/pagination/types/paginationTypesConvex.js';
import type { PaginationOptions } from 'convex/server';

export async function getCouponPage({
	ctx,
	paginationOpts
}: {
	ctx: Pick<QueryCtx, 'db'>;
	paginationOpts: PaginationOptions;
}): Promise<ConvexPaginatedPage<Doc<'coupons'>>> {
	return getPagination(ctx.db.query('coupons').order('desc'), { paginationOpts });
}
