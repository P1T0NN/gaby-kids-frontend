<script lang="ts">
	// UTILS
	import { cn } from '@/utils/utils.js';
	import { formatPrice } from '@/shared/utils/pricing.js';

	// TYPES
	import type { Doc } from '@convex/_generated/dataModel.js';

	let {
		product,
		thumbnailSize = 56
	}: {
		product: Doc<'products'>;
		/** Square thumbnail size in px. */
		thumbnailSize?: 48 | 56;
	} = $props();

	const thumbnailClass = $derived(thumbnailSize === 48 ? 'size-12' : 'size-14');
</script>

{#if product.images[0]}
	<img
		src={product.images[0]}
		alt=""
		width={thumbnailSize}
		height={thumbnailSize}
		class={cn(thumbnailClass, 'shrink-0 rounded-lg object-cover')}
	/>
{:else}
	<div class={cn('flex shrink-0 items-center justify-center rounded-lg bg-muted', thumbnailClass)}>
		<span class="icon-[lucide--package] size-5 text-muted-foreground" aria-hidden="true"></span>
	</div>
{/if}
<div class="min-w-0">
	<p class="truncate text-sm font-medium">{product.name}</p>
	<p class="text-sm text-muted-foreground">{formatPrice(product.priceInCents)}</p>
</div>
