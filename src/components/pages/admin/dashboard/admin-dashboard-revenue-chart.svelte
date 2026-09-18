<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime';

	// COMPONENTS
	import { ChartTooltip } from '@/components/ui/chart/index.js';
	import AreaChart from '@/components/ui/custom-components/custom-charts/charts-only/area-chart.svelte';

	// CONFIG
	import { COMPANY_DATA } from '@/shared/config';

	// UTILS
	import { formatPrice } from '@/shared/utils/pricing.js';

	// TYPES
	import type { ChartConfig } from '@/components/ui/chart/index.js';

	type RevenueMetric = {
		date: Date;
		revenueInCents: number;
	};

	let {
		data,
		rangeLabel,
		granularity = 'day',
		cardClass
	}: {
		data: RevenueMetric[];
		rangeLabel: string;
		granularity?: 'day' | 'hour';
		cardClass?: string;
	} = $props();

	const chartData = $derived(
		data.map((metric) => ({ date: metric.date, revenue: metric.revenueInCents / 100 }))
	);
	const totalInCents = $derived(
		data.reduce((total, metric) => total + metric.revenueInCents, 0)
	);
	const hasRevenue = $derived(data.some((metric) => metric.revenueInCents > 0));

	const chartConfig = {
		revenue: {
			label: m['AdminDashboardPage.AdminDashboardRevenueChart.seriesLabel'](),
			color: 'var(--color-primary)'
		}
	} satisfies ChartConfig;

	function formatAxisRevenue(value: number) {
		return new Intl.NumberFormat(getLocale(), {
			style: 'currency',
			currency: COMPANY_DATA.CURRENCY,
			notation: 'compact',
			maximumFractionDigits: 1
		}).format(value);
	}

	function formatAxisDate(value: Date | string | number) {
		if (!(value instanceof Date)) return String(value);
		return granularity === 'hour'
			? value.toLocaleTimeString(getLocale(), { hour: 'numeric' })
			: value.toLocaleDateString(getLocale(), { month: 'short', day: 'numeric' });
	}

	function formatTooltipLabel(value: Date | string | number) {
		if (!(value instanceof Date)) return String(value);
		return granularity === 'hour'
			? value.toLocaleString(getLocale(), {
					month: 'short',
					day: 'numeric',
					hour: 'numeric',
					minute: '2-digit'
				})
			: value.toLocaleDateString(getLocale(), {
					weekday: 'short',
					month: 'short',
					day: 'numeric'
				});
	}
</script>

<AreaChart
	data={chartData}
	x="date"
	config={chartConfig}
	{cardClass}
	title={m['AdminDashboardPage.AdminDashboardRevenueChart.title']()}
	description={rangeLabel}
	xAxisFormat={formatAxisDate}
	yAxisFormat={formatAxisRevenue}
	yDomain={hasRevenue ? undefined : [0, 1]}
	containerClass="-ml-3 aspect-auto h-72 w-full"
	footerDateRange={m['AdminDashboardPage.AdminDashboardRevenueChart.total']({ value: formatPrice(totalInCents) })}
>
	{#snippet tooltip()}
		<ChartTooltip labelFormatter={formatTooltipLabel} indicator="line">
			{#snippet formatter({ value, name })}
				<div class="flex w-full items-center justify-between gap-3">
					<span class="text-muted-foreground">{name}</span>
					<span class="font-mono font-medium text-foreground tabular-nums">
						{formatPrice(Number(value) * 100)}
					</span>
				</div>
			{/snippet}
		</ChartTooltip>
	{/snippet}
</AreaChart>
