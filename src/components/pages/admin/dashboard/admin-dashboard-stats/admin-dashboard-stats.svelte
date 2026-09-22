<script lang="ts">
	// LIBRARIES
	import { getLocale } from '@/lib/paraglide/runtime';
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import AdminDashboardStatsLoading from '@/components/pages/admin/dashboard/loading/admin-dashboard-stats-loading.svelte';
	import AnalyticsStatsCard from '@/features/analytics/components/analytics-stats-card/analytics-stats-card.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';

	// HOOKS
	import { useAnalyticsDashboard } from '@/features/analytics/hooks/useAnalyticsDashboard.svelte.js';

	// UTILS
	import { getComparisonPercentage } from '@/shared/features/analytics/utils/getComparisonPercentage.js';
	import { formatPrice } from '@/shared/utils/pricing.js';

	// TYPES
	import type { AnalyticsStat } from '@/shared/features/analytics/types/analyticsTypes.js';

	const analytics = useAnalyticsDashboard();

	const stats = $derived.by<AnalyticsStat[]>(() => {
		const data = analytics.statsData;
		if (!data) return [];

		const locale = getLocale();
		const { current, previous } = data;

		return [
			{
				title: m['AnalyticsFeature.AnalyticsData.revenue'](),
				value: current.revenue,
				format: (value) => formatPrice(value, undefined, locale),
				change: getComparisonPercentage(current.revenue, previous.revenue)
			},
			{
				title: m['AnalyticsFeature.AnalyticsData.orders'](),
				value: current.orders,
				change: getComparisonPercentage(current.orders, previous.orders)
			},
			{
				title: m['AnalyticsFeature.AnalyticsData.averageOrderValue'](),
				value: current.averageOrderValue,
				format: (value) => formatPrice(value, undefined, locale),
				change: getComparisonPercentage(current.averageOrderValue, previous.averageOrderValue)
			}
		];
	});
</script>

{#if analytics.statsError}
	<ErrorComponent message={m['AdminDashboardPage.AdminDashboardStats.loadError']()} />
{:else if analytics.statsLoading || stats.length === 0}
	<AdminDashboardStatsLoading />
{:else}
	<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
		{#each stats as stat (stat.title)}
			<AnalyticsStatsCard {...stat} />
		{/each}
	</div>
{/if}
