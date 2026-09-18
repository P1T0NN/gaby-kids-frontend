// DATA
import { DASHBOARD_PRESET_DAYS } from '../data/analyticsData.js';

// TYPES
import type { DashboardDateRange, DashboardRangeValue } from '../types/analyticsTypes.js';

function isPresetRangeValue(value: string): value is '7d' | '30d' | '90d' {
	return Object.hasOwn(DASHBOARD_PRESET_DAYS, value);
}

export function getDashboardRangeValue(
	value: string,
	customRange?: DashboardDateRange
): DashboardRangeValue {
	if (value === 'today' || isPresetRangeValue(value)) return value;
	return customRange ? 'custom' : '30d';
}
