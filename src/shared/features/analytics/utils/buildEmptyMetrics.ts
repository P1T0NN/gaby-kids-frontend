// TYPES
import type {
	DashboardDateRange,
	DashboardMetric,
	DashboardRangeValue
} from '../types/analyticsTypes.js';

// UTILS
import { DAY_MS, HOUR_MS } from '../../../utils/date.js';

function createZeroMetric(date: Date): DashboardMetric {
	return { date, revenueInCents: 0, orders: 0, units: 0 };
}

export function buildEmptyMetrics(
	range: DashboardRangeValue,
	bounds: DashboardDateRange
): DashboardMetric[] {
	const stepMs = range === 'today' ? HOUR_MS : DAY_MS;
	const metrics: DashboardMetric[] = [];

	for (let time = bounds.start.getTime(); time <= bounds.end.getTime(); time += stepMs) {
		metrics.push(createZeroMetric(new Date(time)));
	}

	if (metrics.length < 2) metrics.push(createZeroMetric(new Date(bounds.end)));

	return metrics;
}
