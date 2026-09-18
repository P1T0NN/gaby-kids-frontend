// TYPES
import type { DashboardDateRange } from '../types/analyticsTypes.js';

export function getDashboardPreviousBounds(bounds: DashboardDateRange): DashboardDateRange {
	const span = bounds.end.getTime() - bounds.start.getTime() + 1;

	return {
		start: new Date(bounds.start.getTime() - span),
		end: new Date(bounds.start.getTime() - 1)
	};
}
