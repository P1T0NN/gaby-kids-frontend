// LIBRARIES
import { getLocalTimeZone, today } from '@internationalized/date';
import { toast } from 'svelte-sonner';
import { m } from '@/lib/paraglide/messages';

// CONFIG
import { ANALYTICS_CONFIG } from '@/shared/features/analytics/config.js';
import { ADMIN_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

// UTILS
import { buildEmptyMetrics } from '@/shared/features/analytics/utils/buildEmptyMetrics.js';
import { getDashboardBounds } from '@/shared/features/analytics/utils/getDashboardBounds.js';
import { getDashboardCustomRangeDays } from '@/shared/features/analytics/utils/getDashboardCustomRangeDays.js';
import { getDashboardPreviousBounds } from '@/shared/features/analytics/utils/getDashboardPreviousBounds.js';
import { getDashboardRangeValue } from '@/shared/features/analytics/utils/getDashboardRangeValue.js';
import { sumDashboardMetrics } from '@/shared/features/analytics/utils/sumDashboardMetrics.js';

// TYPES
import type { DateRange } from 'bits-ui';
import type { DashboardDateRange } from '@/shared/features/analytics/types/analyticsTypes.js';
import type { DashboardAttentionItem, DashboardTopProduct } from '../types/analyticsTypes.js';

export function useAnalyticsDashboard() {
	const timeZone = getLocalTimeZone();

	let groupValue = $state('30d');
	let customRange = $state<DateRange | undefined>(undefined);

	const customDateRange = $derived(toDashboardDateRange(customRange));
	const timeRange = $derived(getDashboardRangeValue(groupValue, customDateRange));
	const bounds = $derived(getDashboardBounds(timeRange, customDateRange));
	const metrics = $derived(buildEmptyMetrics(timeRange, bounds));
	const totals = $derived(sumDashboardMetrics(metrics));
	const previousTotals = $derived(
		sumDashboardMetrics(buildEmptyMetrics(timeRange, getDashboardPreviousBounds(bounds)))
	);
	const granularity: 'day' | 'hour' = $derived(timeRange === 'today' ? 'hour' : 'day');

	const topProducts: DashboardTopProduct[] = [];

	const attentionItems: DashboardAttentionItem[] = $derived([
		{
			key: 'pendingOrders',
			label: m['AdminDashboardPage.AdminDashboardAttention.pendingOrders'](),
			hint: m['AdminDashboardPage.AdminDashboardAttention.pendingOrdersHint'](),
			count: 0,
			href: ADMIN_PAGE_ENDPOINTS.ORDERS,
			iconClass: 'icon-[lucide--shopping-bag] size-4',
			variant: 'default'
		},
		{
			key: 'lowStock',
			label: m['AdminDashboardPage.AdminDashboardAttention.lowStock'](),
			hint: m['AdminDashboardPage.AdminDashboardAttention.lowStockHint'](),
			count: 0,
			href: ADMIN_PAGE_ENDPOINTS.PRODUCTS,
			iconClass: 'icon-[lucide--triangle-alert] size-4',
			variant: 'warning'
		},
		{
			key: 'drafts',
			label: m['AdminDashboardPage.AdminDashboardAttention.drafts'](),
			hint: m['AdminDashboardPage.AdminDashboardAttention.draftsHint'](),
			count: 0,
			href: ADMIN_PAGE_ENDPOINTS.PRODUCTS,
			iconClass: 'icon-[lucide--eye-off] size-4',
			variant: 'outline'
		}
	]);

	function toDashboardDateRange(range: DateRange | undefined): DashboardDateRange | undefined {
		if (!range?.start || !range.end) return undefined;

		return { start: range.start.toDate(timeZone), end: range.end.toDate(timeZone) };
	}

	function applyCustomRange(range: DateRange | undefined): boolean {
		const dateRange = toDashboardDateRange(range);
		if (!dateRange) return false;

		if (getDashboardCustomRangeDays(dateRange) > ANALYTICS_CONFIG.maxCustomRangeDays) {
			toast.error(m['AdminDashboardPage.customRangeTooLong']());
			return false;
		}

		customRange = range;
		groupValue = 'custom';
		return true;
	}

	return {
		get groupValue() {
			return groupValue;
		},
		set groupValue(value: string) {
			groupValue = value;
		},
		get customRange() {
			return customRange;
		},
		set customRange(value: DateRange | undefined) {
			customRange = value;
		},
		get metrics() {
			return metrics;
		},
		get timeRange() {
			return timeRange;
		},
		get totals() {
			return totals;
		},
		get previousTotals() {
			return previousTotals;
		},
		get granularity() {
			return granularity;
		},
		get topProducts() {
			return topProducts;
		},
		get attentionItems() {
			return attentionItems;
		},
		minDate: today(timeZone).subtract({ days: ANALYTICS_CONFIG.historyDays - 1 }),
		maxDate: today(timeZone),
		applyCustomRange
	};
}
