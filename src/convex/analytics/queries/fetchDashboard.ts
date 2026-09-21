// LIBRARIES
import { v } from 'convex/values';

// BUILDERS
import { adminQuery } from '../../builders/convexFunctionBuilders.js';

// CONFIG
import { MAX_RANGE_DAYS } from '../../../shared/features/analytics/config.js';

// HELPERS
import { assertDateRange } from '../helpers/assertDateRange.js';
import { DAY_IN_MS } from '../helpers/dailySalesRange.js';
import { getDashboardStats } from '../helpers/getDashboardStats.js';

// VALIDATORS
import { dashboardComparison } from '../validators/analyticsValidators.js';

// TYPES
import type { DashboardComparison } from '../../../shared/features/analytics/types/analyticsTypes.js';

function assertRangeWithinMaxDays(range: { from: number; to: number }): void {
	if ((range.to - range.from) / DAY_IN_MS > MAX_RANGE_DAYS) {
		throw new Error('Invalid dashboard date range');
	}
}

export const fetchDashboard = adminQuery({
	args: {
		current: v.object({ from: v.number(), to: v.number() }),
		previous: v.object({ from: v.number(), to: v.number() })
	},
	returns: dashboardComparison,
	handler: async (ctx, args): Promise<DashboardComparison> => {
		assertDateRange(args.current);
		assertDateRange(args.previous);
		assertRangeWithinMaxDays(args.current);
		assertRangeWithinMaxDays(args.previous);

		const [current, previous] = await Promise.all([
			getDashboardStats(ctx, args.current),
			getDashboardStats(ctx, args.previous)
		]);

		return { current, previous };
	}
});
