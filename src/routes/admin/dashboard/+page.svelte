<script lang="ts">
	// LIBRARIES
	import { getLocalTimeZone } from '@internationalized/date';
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime';

	// COMPONENTS
	import AdminDashboardAttention from '@/components/pages/admin/dashboard/admin-dashboard-attention/admin-dashboard-attention.svelte';
	import AdminDashboardHeader from '@/components/pages/admin/dashboard/admin-dashboard-header.svelte';
	import AdminDashboardRevenueChart from '@/components/pages/admin/dashboard/admin-dashboard-revenue-chart.svelte';
	import AdminDashboardStats from '@/components/pages/admin/dashboard/admin-dashboard-stats.svelte';
	import AdminDashboardTopProducts from '@/components/pages/admin/dashboard/admin-dashboard-top-products/admin-dashboard-top-products.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';

	// HOOKS
	import { useAnalyticsDashboard } from '@/features/analytics/hooks/useAnalyticsDashboard.svelte.js';

	// TYPES
	import type { DateRange } from 'bits-ui';
	import type { DashboardRangeValue } from '@/shared/features/analytics/types/analyticsTypes.js';

	const dashboard = useAnalyticsDashboard();

	const rangeLabel = $derived(
		dashboard.timeRange === 'custom' && dashboard.customRange?.start && dashboard.customRange?.end
			? formatCustomRangeLabel(dashboard.customRange)
			: getPresetRangeLabel(dashboard.timeRange)
	);

	function getPresetRangeLabel(range: DashboardRangeValue): string {
		if (range === 'today') return m['AdminDashboardPage.rangeToday']();
		if (range === '7d') return m['AdminDashboardPage.range7Days']();
		if (range === '90d') return m['AdminDashboardPage.range90Days']();
		return m['AdminDashboardPage.range30Days']();
	}

	function formatCustomRangeLabel(range: DateRange) {
		if (!range.start || !range.end) return '';

		const timeZone = getLocalTimeZone();
		const options: Intl.DateTimeFormatOptions = {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		};
		const start = range.start.toDate(timeZone).toLocaleDateString(getLocale(), options);
		const end = range.end.toDate(timeZone).toLocaleDateString(getLocale(), options);

		return `${start} – ${end}`;
	}
</script>

<SvelteHead
	title={m['AdminDashboardPage.pageTitle']()}
	description={m['AdminDashboardPage.description']()}
	noindex
/>

<div class="flex min-h-full min-w-0 flex-1 flex-col gap-6">
	<AdminDashboardHeader {dashboard} />

	<AdminDashboardStats totals={dashboard.totals} previousTotals={dashboard.previousTotals} />

	<div class="grid gap-4 xl:grid-cols-3">
		<AdminDashboardRevenueChart
			data={dashboard.metrics}
			{rangeLabel}
			granularity={dashboard.granularity}
			cardClass="xl:col-span-2"
		/>
		
		<AdminDashboardAttention items={dashboard.attentionItems} />
	</div>

	<AdminDashboardTopProducts products={dashboard.topProducts} {rangeLabel} />
</div>
