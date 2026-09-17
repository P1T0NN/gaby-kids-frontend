<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Separator } from '@/components/ui/separator/index.js';
	import AddToCartButton from '@/features/cart/components/add-to-cart-button.svelte';
	import ProductVariantPicker from '@/components/pages/(unprotected)/product/product-variant-picker.svelte';
	import ProductUpsellItem from './product-upsell-item.svelte';

	// UTILS
	import { getProductVariantAvailability } from '@/features/productVariants/utils/getProductVariantAvailability.js';

	// TYPES
	import type { FunctionReturnType } from 'convex/server';
	import type { api } from '@convex/_generated/api';

	type StorefrontProduct = NonNullable<
		FunctionReturnType<typeof api.tables.products.queries.fetchProductBySlug.fetchProductBySlug>
	>;
	type StorefrontProductVariant = StorefrontProduct['productVariants'][number];

	let {
		product,
		productVariants,
		productVariant,
		onSelectProductVariant,
		disabled = false
	}: {
		product: StorefrontProduct;
		productVariants: StorefrontProductVariant[];
		productVariant: StorefrontProductVariant;
		onSelectProductVariant: (productVariantId: string) => void;
		disabled?: boolean;
	} = $props();

	const availability = $derived(getProductVariantAvailability(product, productVariant));
	const hint = $derived(
		availability.type === 'sold_out'
			? m['ProductPage.ProductDetails.soldOutHint']()
			: availability.type === 'temporarily_unavailable'
				? m['ProductPage.ProductDetails.temporarilyUnavailableHint']()
				: m['ProductPage.ProductDetails.cartHint']()
	);
</script>

<div class="flex min-w-0 flex-col gap-8 lg:col-start-2 lg:row-start-2">
	<div class="flex flex-col gap-5">
		{#if productVariants.length > 1}
			<ProductVariantPicker
				{product}
				{productVariants}
				selectedProductVariantId={productVariant._id}
				{onSelectProductVariant}
				{disabled}
			/>
		{/if}

		<div class="flex flex-col gap-3">
			<AddToCartButton
				item={{
					productVariantId: productVariant._id,
					image: productVariant.images[0] ?? product.images[0] ?? ''
				}}
				productId={product._id}
				name={product.name}
				openCartAfterAdd
				showUpsellsAfterAdd={product.upsells.length > 0}
				{disabled}
				{availability}
				size="lg"
				class="h-14 w-full"
				aria-label={m['ProductPage.ProductDetails.addProduct']({ name: product.name })}
			/>
			<p class="text-center text-sm text-muted-foreground">
				{hint}
			</p>
		</div>
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
