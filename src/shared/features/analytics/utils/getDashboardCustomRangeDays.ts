// TYPES
import type { DashboardDateRange } from '../types/analyticsTypes.js';

// UTILS
import { DAY_MS, endOfDay, startOfDay } from '../../../utils/date.js';

export function getDashboardCustomRangeDays(range: DashboardDateRange): number {
	const start = startOfDay(range.start);
	const end = endOfDay(range.end);

	return Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1;
}
