<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import ButtonLink from '@/components/ui/custom-components/button-link/button-link.svelte';
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
		onAdded
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
		onAdded: () => void;
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

<div
	class="grid h-full min-w-0 grid-cols-[4.5rem_minmax(0,1fr)] items-start gap-3 rounded-xl border border-border bg-background p-3"
>
	<div
		class="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-muted"
	>
		{#if image && failedImage !== image}
			<img
				src={image}
				alt=""
				width="480"
				height="480"
				loading="lazy"
				decoding="async"
				class="absolute inset-0 block h-full w-full object-cover"
				onerror={() => (failedImage = image)}
			/>
		{:else}
			<span class="icon-[lucide--image] size-8 text-muted-foreground/60" aria-hidden="true"></span>
		{/if}
	</div>
	<div class="flex h-full min-w-0 flex-col gap-2">
		<h3 class="text-sm leading-5 font-medium wrap-anywhere" title={product.name}>
			{product.name}
		</h3>
		<div class="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
			<ProductPrice
				priceInCents={product.priceInCents}
				compareAtPriceInCents={product.compareAtPriceInCents}
				from={product.hasPriceRange}
				priceClass="text-base leading-6"
			/>
			{#if defaultProductVariantId}
				<AddToCartButton
					item={{ productVariantId: defaultProductVariantId, image: image ?? '' }}
					productId={product._id}
					name={product.name}
					variant="outline"
					size="sm"
					class="min-h-11 gap-1.5 px-3"
					aria-label={m['UpsellsFeature.UpsellsDialogItem.addProduct']({ name: product.name })}
					toasterId="upsells-dialog"
					{availability}
					{onAdded}
				>
					<span class="icon-[lucide--plus] size-4" aria-hidden="true"></span>
					{m['UpsellsFeature.UpsellsDialogItem.add']()}
				</AddToCartButton>
			{:else}
				<ButtonLink
					href={UNPROTECTED_PAGE_ENDPOINTS.PRODUCT(product.slug)}
					variant="outline"
					size="sm"
					class="min-h-11 px-3"
				>
					{m['UpsellsFeature.UpsellsDialogItem.viewOptions']()}
				</ButtonLink>
			{/if}
		</div>
	</div>
</div>
