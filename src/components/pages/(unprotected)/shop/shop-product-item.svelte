<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import * as Card from '@/components/ui/card/index.js';
	import AddToCartButton from '@/features/cart/components/add-to-cart-button.svelte';
	import ProductPrice from '@/features/products/components/product-price.svelte';
	import Link from '@/components/ui/custom-components/link/link.svelte';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';
	import { PRODUCTS_CONFIG } from '@/shared/features/products/config.js';

	// TYPES
	import type { Doc } from '@convex/_generated/dataModel';

	let { product }: { product: Doc<'products'> } = $props();

	let failedImage = $state<string | null>(null);

	const image = $derived(product.images[0]);
</script>

{#snippet productContent()}
	<div class="aspect-13/10 overflow-hidden bg-muted">
		{#if image && failedImage !== image}
			<img
				src={image}
				alt={product.name}
				width="480"
				height="480"
				loading="lazy"
				decoding="async"
				class="block h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
				onerror={() => (failedImage = image)}
			/>
		{:else}
			<div class="flex h-full flex-col items-center justify-center gap-2 p-6 text-muted-foreground">
				<span class="icon-[lucide--image] size-8" aria-hidden="true"></span>
				<p class="text-sm">{m['ShopPage.ShopProductItem.noImage']()}</p>
			</div>
		{/if}
	</div>

	<Card.Header>
		<Card.Title>
			<h2 class="line-clamp-2 wrap-anywhere" title={product.name}>{product.name}</h2>
		</Card.Title>
		<Card.Description class="line-clamp-3 wrap-anywhere">{product.description}</Card.Description>
		<ProductPrice
			priceInCents={product.priceInCents}
			compareAtPriceInCents={product.compareAtPriceInCents}
			priceClass="text-lg"
		/>
	</Card.Header>
{/snippet}

<Card.Root class="h-full gap-4 pt-0" size="sm">
	{#if PRODUCTS_CONFIG.HAS_PRODUCT_PAGE}
		<Link
			href={UNPROTECTED_PAGE_ENDPOINTS.PRODUCT(product.slug)}
			class="group flex flex-col gap-4 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
		>
			{@render productContent()}
		</Link>
	{:else}
		<div class="flex flex-col gap-4">{@render productContent()}</div>
	{/if}

	<Card.Footer class="mt-auto">
		<AddToCartButton
			item={{ id: product._id, image: image ?? '' }}
			name={product.name}
			showUpsellsAfterAdd={Boolean(product.upsellProductIds?.length)}
			aria-label={m['ShopPage.ShopProductItem.addProduct']({ name: product.name })}
			class="w-full"
			size="lg"
		/>
	</Card.Footer>
</Card.Root>
