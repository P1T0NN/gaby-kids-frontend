<script lang="ts">
	// UTILS
	import { formatPrice } from '@/shared/features/cart/utils/formatPrice.js';

	// TYPES
	import type { Doc } from '@convex/_generated/dataModel';

	let { product }: { product: Doc<'products'> } = $props();
</script>

<header class="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-start-1 lg:pt-3">
	<h1
		id="product-name"
		class="text-3xl leading-tight font-semibold tracking-tight text-balance wrap-anywhere sm:text-4xl"
	>
		{product.name}
	</h1>
	<p class="text-2xl font-medium tracking-tight wrap-anywhere tabular-nums">
		{formatPrice(product.priceInCents)}
	</p>
</header>
