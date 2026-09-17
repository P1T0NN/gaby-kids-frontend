<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import ButtonLink from '@/components/ui/custom-components/button-link/button-link.svelte';
	import Link from '@/components/ui/custom-components/link/link.svelte';
	import AddToCartButton from '@/features/cart/components/add-to-cart-button.svelte';
	import ProductPrice from '@/features/products/components/product-price.svelte';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// UTILS
	import { getProductAvailability } from '@/shared/features/products/utils/getProductAvailability.js';

	// TYPES
	import type { Id } from '@convex/_generated/dataModel';
	import type { ProductVariantSummary } from '@/shared/features/productVariants/types/productVariantTypes.js';

	let {
		product,
		disabled = false
	}: {
		product: {
			_id: Id<'products'>;
			name: string;
			slug: string;
			priceInCents: number;
			compareAtPriceInCents?: number;
			hasPriceRange: boolean;
			images: string[];
			trackInventory: boolean;
			productVariantSummary: ProductVariantSummary;
		};
		disabled?: boolean;
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
	const defaultProductVariantId = $derived(product.productVariantSummary.defaultProductVariantId);
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
			<ProductPrice
				priceInCents={product.priceInCents}
				compareAtPriceInCents={product.compareAtPriceInCents}
				from={product.hasPriceRange}
				priceClass="text-sm"
			/>
		</div>
	</Link>
	{#if defaultProductVariantId}
		<AddToCartButton
			item={{ productVariantId: defaultProductVariantId, image: image ?? '' }}
			productId={product._id}
			name={product.name}
			{disabled}
			{availability}
			variant="outline"
			class="min-h-11 shrink-0"
			aria-label={m['ProductPage.ProductUpsellItem.addProduct']({ name: product.name })}
		>
			{m['ProductPage.ProductUpsellItem.add']()}
		</AddToCartButton>
	{:else}
		<ButtonLink
			href={UNPROTECTED_PAGE_ENDPOINTS.PRODUCT(product.slug)}
			variant="outline"
			class="min-h-11 shrink-0"
		>
			{m['ProductPage.ProductUpsellItem.viewOptions']()}
		</ButtonLink>
	{/if}
</li>
