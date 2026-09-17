<script lang="ts">
	// COMPONENTS
	import ProductPrice from '@/features/products/components/product-price.svelte';

	// TYPES
	import type { FunctionReturnType } from 'convex/server';
	import type { api } from '@convex/_generated/api';

	type StorefrontProduct = NonNullable<
		FunctionReturnType<typeof api.tables.products.queries.fetchProductBySlug.fetchProductBySlug>
	>;

	let {
		product,
		productVariant
	}: {
		product: StorefrontProduct;
		productVariant: StorefrontProduct['productVariants'][number];
	} = $props();
</script>

<header class="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-start-1 lg:pt-3">
	<h1
		id="product-name"
		class="text-3xl leading-tight font-semibold tracking-tight text-balance wrap-anywhere sm:text-4xl"
	>
		{product.name}
	</h1>
	<ProductPrice
		priceInCents={productVariant.priceInCents}
		compareAtPriceInCents={productVariant.compareAtPriceInCents}
		class="tracking-tight wrap-anywhere"
		priceClass="text-2xl font-medium"
	/>
</header>
