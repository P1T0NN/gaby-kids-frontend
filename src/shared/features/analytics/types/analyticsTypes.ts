export type DashboardRangeValue = 'today' | '7d' | '30d' | '90d' | 'custom';

export type DashboardDateRange = {
	start: Date;
	end: Date;
};

export type DashboardMetric = {
	date: Date;
	revenueInCents: number;
	orders: number;
	units: number;
};

export type DashboardTotals = {
	revenueInCents: number;
	orders: number;
	units: number;
};
