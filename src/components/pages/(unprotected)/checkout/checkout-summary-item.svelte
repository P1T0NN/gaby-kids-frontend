<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import ProductPrice from '@/features/products/components/product-price.svelte';

	// UTILS
	import { formatPrice } from '@/shared/utils/pricing.js';
	// TYPES
	import type { CartItem, CartProduct } from '@/shared/features/cart/types/cartTypes.js';

	let { item }: { item: CartItem & CartProduct } = $props();
</script>

<li class="flex items-start gap-4 py-4 first:pt-0">
	<div
		class="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted"
	>
		{#if item.image}
			<img src={item.image} alt="" class="size-full object-cover" loading="lazy" />
		{:else}
			<span class="icon-[lucide--package] size-6 text-muted-foreground" aria-hidden="true"></span>
		{/if}
	</div>
	<div class="flex min-w-0 flex-1 flex-col gap-1">
		<p class="text-sm font-medium wrap-break-word">{item.name}</p>
		<div class="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
			<span>{m['CheckoutPage.CheckoutSummaryItem.quantity']({ quantity: item.quantity })}</span>
			<span aria-hidden="true">·</span>
			<ProductPrice
				priceInCents={item.priceInCents}
				compareAtPriceInCents={item.compareAtPriceInCents}
				class="inline-flex"
				priceClass="text-xs font-normal"
				compareAtPriceClass="text-xs"
				discountClass="text-[10px]"
			/>
		</div>
	</div>
	<p class="shrink-0 text-sm font-medium tabular-nums">
		{formatPrice(item.priceInCents * item.quantity)}
	</p>
</li>
