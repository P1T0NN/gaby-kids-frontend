// LIBRARIES
import { v } from 'convex/values';

export const dashboardStats = v.object({
	revenue: v.number(),
	orders: v.number(),
	averageOrderValue: v.number()
});

export const dashboardComparison = v.object({
	current: dashboardStats,
	previous: dashboardStats
});

export const revenueSeriesPoint = v.object({
	date: v.number(),
	revenue: v.number()
});

export const revenueSeries = v.array(revenueSeriesPoint);
