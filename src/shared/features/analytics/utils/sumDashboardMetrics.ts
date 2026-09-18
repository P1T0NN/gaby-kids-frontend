// TYPES
import type { DashboardMetric, DashboardTotals } from '../types/analyticsTypes.js';

export function sumDashboardMetrics(metrics: DashboardMetric[]): DashboardTotals {
	return metrics.reduce(
		(totals, metric) => ({
			revenueInCents: totals.revenueInCents + metric.revenueInCents,
			orders: totals.orders + metric.orders,
			units: totals.units + metric.units
		}),
		{ revenueInCents: 0, orders: 0, units: 0 }
	);
}
