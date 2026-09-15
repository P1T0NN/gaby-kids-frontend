<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// UTILS
	import { cn } from '@/utils/utils.js';
	import { formatPrice, getDiscountPercent } from '@/shared/utils/pricing.js';

	type Props = {
		priceInCents: number;
		compareAtPriceInCents?: number;
		class?: string;
		priceClass?: string;
		compareAtPriceClass?: string;
		discountClass?: string;
	};

	let {
		priceInCents,
		compareAtPriceInCents,
		class: className,
		priceClass,
		compareAtPriceClass,
		discountClass
	}: Props = $props();

	const discountPercent = $derived(getDiscountPercent(priceInCents, compareAtPriceInCents));
</script>

<div class={cn('flex flex-wrap items-baseline gap-x-2 gap-y-1', className)}>
	<span class={cn('font-semibold tabular-nums', priceClass)}>{formatPrice(priceInCents)}</span>

	{#if discountPercent !== null && compareAtPriceInCents !== undefined}
		<del class={cn('text-sm text-muted-foreground tabular-nums', compareAtPriceClass)}>
			{formatPrice(compareAtPriceInCents)}
		</del>

		<span class={cn('text-xs font-semibold text-primary', discountClass)}>
			{m['ProductsFeature.ProductPrice.discount']({ percent: discountPercent })}
		</span>
	{/if}
</div>
