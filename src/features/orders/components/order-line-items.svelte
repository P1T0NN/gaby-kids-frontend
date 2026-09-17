<script lang="ts">
	// UTILS
	import { formatPrice } from '@/shared/utils/pricing.js';

	// TYPES
	import type { Doc } from '@convex/_generated/dataModel';

	let {
		items,
		subtotalInCents,
		totalInCents,
		quantityLabel,
		subtotalLabel,
		totalLabel
	}: {
		items: Doc<'orderItems'>[];
		subtotalInCents: number;
		totalInCents: number;
		quantityLabel: (quantity: number) => string;
		subtotalLabel: string;
		totalLabel: string;
	} = $props();
</script>

<ul class="divide-y divide-border">
	{#each items as item (item._id)}
		<li class="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
			<div class="min-w-0">
				<p class="truncate font-medium">{item.name}</p>
				{#if item.productVariantLabel || item.sku}
					<p class="truncate text-xs text-muted-foreground">
						{[item.productVariantLabel, item.sku].filter(Boolean).join(' · ')}
					</p>
				{/if}
				<p class="text-xs text-muted-foreground">{quantityLabel(item.quantity)}</p>
			</div>
			<p class="shrink-0 font-medium tabular-nums">
				{formatPrice(item.unitPriceInCents * item.quantity)}
			</p>
		</li>
	{/each}
</ul>

<dl class="mt-5 flex flex-col gap-2 border-t pt-5 text-sm">
	<div class="flex justify-between">
		<dt class="text-muted-foreground">{subtotalLabel}</dt>
		<dd class="tabular-nums">{formatPrice(subtotalInCents)}</dd>
	</div>
	<div class="flex justify-between text-base font-semibold">
		<dt>{totalLabel}</dt>
		<dd class="tabular-nums">{formatPrice(totalInCents)}</dd>
	</div>
</dl>
