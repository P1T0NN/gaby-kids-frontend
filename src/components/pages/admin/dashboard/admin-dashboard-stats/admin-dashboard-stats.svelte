<script lang="ts">
	// LIBRARIES
	import { getLocale } from '@/lib/paraglide/runtime';
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import AnalyticsStatsCard from '@/features/analytics/components/analytics-stats-card/analytics-stats-card.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import { Skeleton } from '@/components/ui/skeleton/index.js';

	// HOOKS
	import { useAnalyticsDashboard } from '@/features/analytics/hooks/useAnalyticsDashboard.svelte.js';

	// UTILS
	import { getComparisonPercentage } from '@/shared/features/analytics/utils/getComparisonPercentage.js';
	import { formatPrice } from '@/shared/utils/pricing.js';

	// TYPES
	import type { AnalyticsStat } from '@/shared/features/analytics/types/analyticsTypes.js';

	const STAT_SKELETONS = [0, 1, 2];

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
{:else if stats.length > 0}
	<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
		{#each stats as stat (stat.title)}
			<AnalyticsStatsCard {...stat} />
		{/each}
	</div>
{:else}
	<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
		{#each STAT_SKELETONS as skeleton (skeleton)}
			<Skeleton class="h-40 rounded-4xl" />
		{/each}
	</div>
{/if}
