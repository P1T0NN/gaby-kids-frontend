<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	// UTILS
	import { formatPrice } from '@/shared/features/cart/utils/formatPrice.js';
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
		<p class="text-xs text-muted-foreground">
			{m['CheckoutPage.CheckoutSummaryItem.quantity']({ quantity: item.quantity })} · {formatPrice(
				item.priceInCents
			)}
		</p>
	</div>
	<p class="shrink-0 text-sm font-medium tabular-nums">
		{formatPrice(item.priceInCents * item.quantity)}
	</p>
</li>
