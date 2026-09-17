<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Badge } from '@/components/ui/badge/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';
	import { formatPrice, getDiscountPercent } from '@/shared/utils/pricing.js';

	type Props = {
		priceInCents: number;
		compareAtPriceInCents?: number;
		/** Prefixes the price with "From" for products whose variants differ in price. */
		from?: boolean;
		class?: string;
		priceClass?: string;
		compareAtPriceClass?: string;
		discountClass?: string;
	};

	let {
		priceInCents,
		compareAtPriceInCents,
		from = false,
		class: className,
		priceClass,
		compareAtPriceClass,
		discountClass
	}: Props = $props();

	const discountPercent = $derived(getDiscountPercent(priceInCents, compareAtPriceInCents));
</script>

<div class={cn('flex flex-wrap items-baseline gap-x-2 gap-y-1', className)}>
	<span class={cn('font-semibold tabular-nums', priceClass)}>
		{#if from}<span class="text-xs font-normal text-muted-foreground">
				{m['ProductsFeature.ProductPrice.from']()}
			</span>{/if}
		{formatPrice(priceInCents)}
	</span>

	{#if discountPercent !== null && compareAtPriceInCents !== undefined}
		<del class={cn('text-sm text-muted-foreground tabular-nums', compareAtPriceClass)}>
			{formatPrice(compareAtPriceInCents)}
		</del>

		<Badge variant="success" class={cn('h-4 px-1.5 py-0 text-[10px] font-semibold', discountClass)}>
			{m['ProductsFeature.ProductPrice.discount']({ percent: discountPercent })}
		</Badge>
	{/if}
</div>
