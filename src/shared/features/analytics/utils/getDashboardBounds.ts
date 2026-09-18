// DATA
import { DASHBOARD_PRESET_DAYS } from '../data/analyticsData.js';

// TYPES
import type { DashboardDateRange, DashboardRangeValue } from '../types/analyticsTypes.js';

// UTILS
import { endOfDay, startOfDay } from '../../../utils/date.js';

export function getDashboardBounds(
	range: DashboardRangeValue,
	customRange?: DashboardDateRange,
	reference: Date = new Date()
): DashboardDateRange {
	if (range === 'custom') {
		if (customRange) {
			return { start: startOfDay(customRange.start), end: endOfDay(customRange.end) };
		}

		return getDashboardBounds('30d', undefined, reference);
	}

	if (range === 'today') {
		return { start: startOfDay(reference), end: reference };
	}

	const start = startOfDay(reference);
	start.setDate(start.getDate() - (DASHBOARD_PRESET_DAYS[range] - 1));

	return { start, end: reference };
}
