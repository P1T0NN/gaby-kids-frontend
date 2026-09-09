<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import Link from '@/components/ui/custom-components/link/link.svelte';
	import AddToCartButton from '@/features/cart/components/add-to-cart-button.svelte';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// UTILS
	import { formatPrice } from '@/shared/features/cart/utils/formatPrice.js';

	// TYPES
	import type { Doc } from '@convex/_generated/dataModel';

	let {
		product,
		disabled = false
	}: {
		product: Pick<Doc<'products'>, '_id' | 'name' | 'slug' | 'priceInCents' | 'images'>;
		disabled?: boolean;
	} = $props();
	let failedImage = $state<string | null>(null);
	const image = $derived(product.images[0]);
</script>

<li class="flex items-center gap-3">
	<Link
		href={UNPROTECTED_PAGE_ENDPOINTS.PRODUCT(product.slug)}
		class="group flex min-w-0 flex-1 items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
	>
		<div
			class="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted/40"
		>
			{#if image && failedImage !== image}
				<img
					src={image}
					alt=""
					width="64"
					height="64"
					loading="lazy"
					class="size-full object-contain p-1"
					onerror={() => (failedImage = image)}
				/>
			{:else}
				<span class="icon-[lucide--image] size-5 text-muted-foreground" aria-hidden="true"></span>
			{/if}
		</div>
		<div class="flex min-w-0 flex-col gap-1">
			<h3 class="text-sm leading-5 font-medium wrap-anywhere group-hover:underline">
				{product.name}
			</h3>
			<p class="text-sm text-muted-foreground tabular-nums">{formatPrice(product.priceInCents)}</p>
		</div>
	</Link>
	<AddToCartButton
		item={{ id: product._id, image: image ?? '' }}
		name={product.name}
		{disabled}
		variant="outline"
		class="min-h-11 shrink-0"
		aria-label={m['ProductPage.ProductUpsellItem.addProduct']({ name: product.name })}
	>
		{m['ProductPage.ProductUpsellItem.add']()}
	</AddToCartButton>
</li>
