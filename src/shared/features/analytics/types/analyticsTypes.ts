export type PresetTimeRange = 'today' | '7d' | '30d' | '90d';
export type TimeRange = PresetTimeRange | 'custom';
export type RangeBounds = { from: Date; to: Date };
export type AnalyticsStat = {
	title: string;
	value: number;
	change?: number;
	format?: (value: number) => string;
};

export type DashboardStats = {
	revenue: number;
	orders: number;
	averageOrderValue: number;
};

export type DashboardComparison = {
	current: DashboardStats;
	previous: DashboardStats;
};

export type RevenuePoint = {
	date: number;
	revenue: number;
};
