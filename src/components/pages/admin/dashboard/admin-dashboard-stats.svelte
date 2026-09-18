<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime';

	// COMPONENTS
	import { Badge } from '@/components/ui/badge/index.js';
	import * as Card from '@/components/ui/card/index.js';

	// UTILS
	import { getAverageOrderValue } from '@/shared/features/orders/utils/getAverageOrderValue.js';
	import { formatPrice } from '@/shared/utils/pricing.js';

	// TYPES
	import type { DashboardStat } from '@/features/analytics/types/analyticsTypes.js';
	import type { DashboardTotals } from '@/shared/features/analytics/types/analyticsTypes.js';

	let {
		totals,
		previousTotals
	}: {
		totals: DashboardTotals;
		previousTotals: DashboardTotals;
	} = $props();

	const countFormatter = new Intl.NumberFormat(getLocale());

	const stats: DashboardStat[] = $derived([
		{
			key: 'revenue',
			label: m['AdminDashboardPage.AdminDashboardStats.revenue'](),
			value: formatPrice(totals.revenueInCents),
			delta: createDelta(totals.revenueInCents, previousTotals.revenueInCents)
		},
		{
			key: 'orders',
			label: m['AdminDashboardPage.AdminDashboardStats.orders'](),
			value: countFormatter.format(totals.orders),
			delta: createDelta(totals.orders, previousTotals.orders)
		},
		{
			key: 'averageOrderValue',
			label: m['AdminDashboardPage.AdminDashboardStats.averageOrderValue'](),
			value: formatPrice(getAverageOrderValue(totals)),
			delta: createDelta(getAverageOrderValue(totals), getAverageOrderValue(previousTotals))
		},
		{
			key: 'unitsSold',
			label: m['AdminDashboardPage.AdminDashboardStats.unitsSold'](),
			value: countFormatter.format(totals.units),
			delta: createDelta(totals.units, previousTotals.units)
		}
	]);

	function createDelta(current: number, previous: number): DashboardStat['delta'] {
		if (previous === 0) return null;

		const percent = ((current - previous) / previous) * 100;

		return {
			label: `${percent >= 0 ? '+' : ''}${percent.toFixed(1)}%`,
			direction: percent >= 0 ? 'up' : 'down'
		};
	}
</script>

<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
	{#each stats as stat (stat.key)}
		<Card.Root size="sm" class="gap-3">
			<Card.Header>
				<Card.Description>{stat.label}</Card.Description>
				<Card.Title class="text-2xl font-semibold tracking-tight tabular-nums">
					{stat.value}
				</Card.Title>

				<Card.Action>
					{#if stat.delta}
						<Badge variant={stat.delta.direction === 'up' ? 'success' : 'destructive'}>
							<span
								class={stat.delta.direction === 'up'
									? 'icon-[lucide--arrow-up-right] size-3'
									: 'icon-[lucide--arrow-down-right] size-3'}
								aria-hidden="true"
							></span>

							{stat.delta.label}
						</Badge>
					{:else}
						<Badge variant="outline">—</Badge>
					{/if}
				</Card.Action>
			</Card.Header>
			
			<Card.Footer class="text-xs text-muted-foreground">
				{m['AdminDashboardPage.AdminDashboardStats.comparedToPrevious']()}
			</Card.Footer>
		</Card.Root>
	{/each}
</div>
