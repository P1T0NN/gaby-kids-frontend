// HELPERS
import { readDailySalesRows } from './dailySalesRange.js';

// UTILS
import { sumBy } from '../../../shared/lib/algorithms/index.js';

// TYPES
import type { QueryCtx } from '../../_generated/server.js';
import type { DashboardStats } from '../../../shared/features/analytics/types/analyticsTypes.js';

export async function getDashboardStats(
	ctx: QueryCtx,
	bounds: { from: number; to: number }
): Promise<DashboardStats> {
	const rows = await readDailySalesRows(ctx, bounds);
	const revenue = sumBy(rows, (row) => row.revenue);
	const orders = sumBy(rows, (row) => row.orders);
	const paidOrders = sumBy(rows, (row) => row.paidOrders);

	return {
		revenue,
		orders,
		averageOrderValue: paidOrders > 0 ? Math.round(revenue / paidOrders) : 0
	};
}
