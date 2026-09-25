<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';
	import { PRODUCTS_CONFIG } from '@/shared/features/products/config.js';
	import { UPSELLS_CONFIG } from '@/shared/features/upsells/config.js';

	// COMPONENTS
	import { Badge } from '@/components/ui/badge/index.js';
	import * as Card from '@/components/ui/card/index.js';
	import AddToCartButton from '@/features/cart/components/add-to-cart-button.svelte';
	import ButtonLink from '@/components/ui/custom-components/button-link/button-link.svelte';
	import ProductPrice from '@/features/products/components/product-price.svelte';
	import Link from '@/components/ui/custom-components/link/link.svelte';

	// UTILS
	import { checkStockStatusLabel } from '@/shared/features/products/utils/checkStockStatusLabel.js';
	import { getProductAvailability } from '@/shared/features/products/utils/getProductAvailability.js';
	import { isNewProductLabel } from '@/shared/features/products/utils/isNewProductLabel.js';

	// TYPES
	import type { Doc } from '@convex/_generated/dataModel';
	import type { ProductVariantSummary } from '@/shared/features/productVariants/types/productVariantTypes.js';

	let {
		product
	}: {
		product: Doc<'products'> & { productVariantSummary: ProductVariantSummary };
	} = $props();

	let failedImage = $state<string | null>(null);

	const image = $derived(product.images[0]);
	const availability = $derived(
		getProductAvailability({
			trackInventory: product.trackInventory,
			inventory: product.productVariantSummary.inventory,
			reservedInventory: product.productVariantSummary.reservedInventory
		})
	);
	const isNew = $derived(isNewProductLabel(product._creationTime));
	const lowStockQuantity = $derived(checkStockStatusLabel(availability));
	const defaultProductVariantId = $derived(product.productVariantSummary.defaultProductVariantId);
</script>

{#snippet productContent()}
	<div class="relative h-96 overflow-hidden bg-muted">
		{#if image && failedImage !== image}
			<img
				src={image}
				alt={product.name}
				width="480"
				height="384"
				loading="lazy"
				decoding="async"
				class="block h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
				onerror={() => (failedImage = image)}
			/>
		{:else}
			<div class="flex h-full flex-col items-center justify-center gap-2 p-6 text-muted-foreground">
				<span class="icon-[lucide--image] size-8" aria-hidden="true"></span>
				<p class="text-sm">{m['ProductsFeature.ProductCard.noImage']()}</p>
			</div>
		{/if}

		{#if isNew}
			<Badge class="absolute start-2 top-2">{m['ProductsFeature.ProductCard.new']()}</Badge>
		{/if}
		{#if lowStockQuantity !== null}
			<Badge
				variant={lowStockQuantity === 1 ? 'destructive' : 'warning'}
				class="absolute end-2 top-2"
			>
				{m['ProductsFeature.ProductCard.lowStock']({ count: lowStockQuantity })}
			</Badge>
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
		{#if defaultProductVariantId}
			<AddToCartButton
				item={{ productVariantId: defaultProductVariantId, image: image ?? '' }}
				productId={product._id}
				name={product.name}
				showUpsellsAfterAdd={UPSELLS_CONFIG.HAS_UPSELLS &&
					Boolean(product.upsellProductIds?.length)}
				aria-label={m['ProductsFeature.ProductCard.addProduct']({ name: product.name })}
				{availability}
				class="w-full"
				size="lg"
			/>
		{:else}
			<ButtonLink
				href={UNPROTECTED_PAGE_ENDPOINTS.PRODUCT(product.slug)}
				variant="outline"
				class="w-full"
				size="lg"
			>
				{m['ProductsFeature.ProductCard.chooseOptions']()}
			</ButtonLink>
		{/if}
	</Card.Footer>
</Card.Root>
