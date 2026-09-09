<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Separator } from '@/components/ui/separator/index.js';
	import AddToCartButton from '@/features/cart/components/add-to-cart-button.svelte';
	import ProductUpsellItem from './product-upsell-item.svelte';

	// TYPES
	import type { FunctionReturnType } from 'convex/server';
	import type { api } from '@convex/_generated/api';

	let {
		product,
		disabled = false
	}: {
		product: NonNullable<
			FunctionReturnType<typeof api.tables.products.queries.fetchProductBySlug.fetchProductBySlug>
		>;
		disabled?: boolean;
	} = $props();
</script>

<div class="flex min-w-0 flex-col gap-8 lg:col-start-2 lg:row-start-2">
	<div class="flex flex-col gap-3">
		<AddToCartButton
			item={{ id: product._id, image: product.images[0] ?? '' }}
			name={product.name}
			openCartAfterAdd
			showUpsellsAfterAdd={product.upsells.length > 0}
			{disabled}
			size="lg"
			class="h-14 w-full"
			aria-label={m['ProductPage.ProductDetails.addProduct']({ name: product.name })}
		/>
		<p class="text-center text-sm text-muted-foreground">
			{m['ProductPage.ProductDetails.cartHint']()}
		</p>
	</div>

	{#if product.upsells.length > 0}
		<Separator />
		<section aria-labelledby="product-upsells" class="flex flex-col gap-4">
			<h2 id="product-upsells" class="text-base font-semibold">
				{m['ProductPage.ProductDetails.upsells']()}
			</h2>
			<ul class="flex flex-col gap-4">
				{#each product.upsells as upsell (upsell._id)}
					<ProductUpsellItem product={upsell} {disabled} />
				{/each}
			</ul>
		</section>
	{/if}

	{#if product.description.trim()}
		<Separator />
		<section aria-labelledby="product-description" class="flex flex-col gap-3">
			<h2 id="product-description" class="text-base font-semibold">
				{m['ProductPage.ProductDetails.description']()}
			</h2>
			<p
				class="max-w-prose text-base leading-7 wrap-anywhere whitespace-pre-line text-muted-foreground"
			>
				{product.description}
			</p>
		</section>
	{/if}
</div>
