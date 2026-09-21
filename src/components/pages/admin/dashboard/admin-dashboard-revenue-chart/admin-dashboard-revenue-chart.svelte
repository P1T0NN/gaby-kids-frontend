<script lang="ts">
	// LIBRARIES
	import { getLocale } from '@/lib/paraglide/runtime';
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import * as Chart from '@/components/ui/chart/index.js';
	import AreaChartInteractive from '@/components/ui/custom-components/custom-charts/area-chart-interactive.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import { Skeleton } from '@/components/ui/skeleton/index.js';

	// CONFIG
	import { COMPANY_DATA } from '@/shared/config.js';

	// HOOKS
	import { useAnalyticsDashboard } from '@/features/analytics/hooks/useAnalyticsDashboard.svelte.js';

	// UTILS
	import { formatCompactPrice, formatPrice } from '@/shared/utils/pricing.js';

	// TYPES
	import type {
		TimeRangeOption,
		TimeRangeValue
	} from '@/components/ui/custom-components/custom-charts/timerange-data.svelte';

	const analytics = useAnalyticsDashboard();

	const locale = $derived(getLocale());

	const timeRange = $derived.by<TimeRangeValue>(() =>
		analytics.activeRange === 'today' ? '1d' : analytics.activeRange
	);

	const timeRangeOptions = [
		{ value: '1d', label: m['AdminDashboardPage.AdminDashboardHeaderTimeranges.today']() },
		{ value: '7d', label: m['AdminDashboardPage.AdminDashboardHeaderTimeranges.last7Days']() },
		{ value: '30d', label: m['AdminDashboardPage.AdminDashboardHeaderTimeranges.last30Days']() },
		{ value: '90d', label: m['AdminDashboardPage.AdminDashboardHeaderTimeranges.last90Days']() }
	] satisfies TimeRangeOption[];

	const chartData = $derived.by(() => {
		const points = (analytics.revenueData ?? []).map((point) => ({
			date: new Date(point.date),
			revenue: point.revenue
		}));

		// A single store day produces one point, which an area chart cannot draw. Render it as the
		// day's cumulative line instead: empty at the day start, the total at the day end.
		if (points.length !== 1) return points;

		return [
			{ date: new Date(analytics.bounds.from.getTime()), revenue: 0 },
			{ date: new Date(analytics.bounds.to.getTime()), revenue: points[0].revenue }
		];
	});

	const config = $derived({
		revenue: {
			label: m['AnalyticsFeature.AnalyticsData.revenue'](),
			color: 'var(--foreground)'
		}
	});

	const yAxisFormat = (value?: number) => formatCompactPrice(value ?? 0, undefined, locale);
	const xAxisFormat = (value: Date | string) =>
		value instanceof Date
			? value.toLocaleDateString(locale, {
					month: 'short',
					day: 'numeric',
					timeZone: COMPANY_DATA.TIMEZONE
				})
			: value;
	const tooltipLabelFormatter = (value: Date | string) =>
		value instanceof Date
			? value.toLocaleDateString(locale, {
					month: 'long',
					day: 'numeric',
					year: 'numeric',
					timeZone: COMPANY_DATA.TIMEZONE
				})
			: value;
</script>

{#snippet tooltip()}
	<Chart.Tooltip nameKey="revenue" labelFormatter={tooltipLabelFormatter} class="min-w-44">
		{#snippet formatter({ value, name }: { value: unknown; name: string })}
			<div class="flex w-full items-center justify-between gap-4 leading-none">
				<span class="text-muted-foreground">{name}</span>
				<span class="font-mono font-medium text-foreground tabular-nums">
					{formatPrice(Number(value), undefined, locale)}
				</span>
			</div>
		{/snippet}
	</Chart.Tooltip>
{/snippet}

{#if analytics.revenueError}
	<ErrorComponent message={m['AdminDashboardPage.RevenueChart.loadError']()} />
{:else if analytics.revenueData}
	<AreaChartInteractive
		data={chartData}
		x="date"
		{config}
		{timeRange}
		customRange={analytics.customRange}
		{timeRangeOptions}
		{locale}
		showTimeRange={false}
		showLegend={false}
		containerClass="aspect-auto h-72 w-full"
		areaChartProps={{ yAxis: { tickSpacing: 72 } }}
		title={m['AdminDashboardPage.RevenueChart.title']()}
		descriptionPrefix={m['AdminDashboardPage.RevenueChart.descriptionPrefix']()}
		{yAxisFormat}
		{xAxisFormat}
		{tooltip}
	/>
{:else}
	<Skeleton class="h-80 rounded-4xl" />
{/if}
