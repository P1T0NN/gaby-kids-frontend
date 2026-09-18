<script lang="ts">
	// LIBRARIES
	import { getLocale } from '@/lib/paraglide/runtime';

	// COMPONENTS
	import * as Avatar from '@/components/ui/avatar/index.js';
	import * as Table from '@/components/ui/table/index.js';

	// UTILS
	import { formatPrice } from '@/shared/utils/pricing.js';

	// TYPES
	import type { DashboardTopProduct } from '@/features/analytics/types/analyticsTypes.js';

	let { product, index }: { product: DashboardTopProduct; index: number } = $props();

	function getInitials(name: string) {
		return name
			.split(' ')
			.map((word) => word[0])
			.slice(0, 2)
			.join('');
	}

	function formatCount(value: number) {
		return new Intl.NumberFormat(getLocale()).format(value);
	}
</script>

<Table.Row>
	<Table.Cell class="ps-6 text-muted-foreground tabular-nums">{index + 1}</Table.Cell>
	<Table.Cell>
		<div class="flex items-center gap-3">
			<Avatar.Root class="size-8 rounded-lg">
				<Avatar.Fallback class="rounded-lg text-xs">
					{getInitials(product.name)}
				</Avatar.Fallback>
			</Avatar.Root>
			<span class="font-medium">{product.name}</span>
		</div>
	</Table.Cell>
	<Table.Cell class="text-end tabular-nums">{formatCount(product.units)}</Table.Cell>
	<Table.Cell class="text-end font-medium tabular-nums">
		{formatPrice(product.revenueInCents)}
	</Table.Cell>
	<Table.Cell class="hidden pe-6 md:table-cell">
		<div class="flex items-center gap-3">
			<div class="h-1.5 w-full min-w-24 overflow-hidden rounded-full bg-muted">
				<div
					class="h-full rounded-full bg-primary"
					style={`width: ${Math.min(100, product.sharePercent)}%`}
				></div>
			</div>
			<span class="w-10 shrink-0 text-end text-xs text-muted-foreground tabular-nums">
				{product.sharePercent.toFixed(0)}%
			</span>
		</div>
	</Table.Cell>
</Table.Row>
