// COMPONENTS
import type { BadgeVariant } from '@/components/ui/badge/index.js';

// TYPES
import type { useAnalyticsDashboard } from '../hooks/useAnalyticsDashboard.svelte.js';

export type AnalyticsDashboardApi = ReturnType<typeof useAnalyticsDashboard>;

export type DashboardStat = {
	key: string;
	label: string;
	value: string;
	delta: { label: string; direction: 'up' | 'down' } | null;
};

export type DashboardAttentionItem = {
	key: string;
	label: string;
	hint: string;
	count: number;
	href: string;
	iconClass: string;
	variant: BadgeVariant;
};

export type DashboardTopProduct = {
	productId: string;
	name: string;
	units: number;
	revenueInCents: number;
	sharePercent: number;
};
