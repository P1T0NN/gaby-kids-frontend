<script lang="ts">
	// LIBRARIES
	import { api } from '@convex/_generated/api';
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import ProductHeader from '@/components/pages/(unprotected)/product/product-header.svelte';
	import ProductDetails from '@/components/pages/(unprotected)/product/product-details.svelte';
	import ProductLoading from '@/components/pages/(unprotected)/product/loading/product-loading.svelte';
	import ImageGallery from '@/components/ui/custom-components/image-gallery/image-gallery.svelte';
	import Link from '@/components/ui/custom-components/link/link.svelte';
	import EmptyData from '@/components/ui/custom-components/empty-data/empty-data.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import Section from '@/components/ui/custom-components/section/section.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// HOOKS
	import { useCachedConvexQuery } from '@/hooks/useCachedConvexQuery.svelte.js';

	// UTILS
	import { getProductVariantAvailability } from '@/features/productVariants/utils/getProductVariantAvailability.js';

	// TYPES
	import type { PageProps } from './$types';

	let { params }: PageProps = $props();

	const product = useCachedConvexQuery(
		api.tables.products.queries.fetchProductBySlug.fetchProductBySlug,
		() => ({ slug: params.slug })
	);

	let selectedProductVariantId = $state('');

	const productVariants = $derived(product.data?.productVariants ?? []);
	const selectedProductVariant = $derived(
		productVariants.find((productVariant) => productVariant._id === selectedProductVariantId) ??
			productVariants.find((productVariant) => {
				if (!product.data) return false;
				const availability = getProductVariantAvailability(product.data, productVariant);
				return availability.type === 'available' || availability.type === 'unlimited';
			}) ??
			productVariants[0]
	);
</script>

<SvelteHead
	title={product.data?.name ?? m['ProductPage.pageTitle']()}
	description={product.data?.description}
	image={product.data?.images[0]}
	noindex={product.data === null}
/>

<Section as="main" size="sm" width="wide" containerClass="flex flex-col gap-6 pb-8 sm:gap-8">
	<Link
		href={UNPROTECTED_PAGE_ENDPOINTS.SHOP}
		class="inline-flex min-h-11 w-fit items-center gap-2 rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
	>
		<span class="icon-[lucide--arrow-left] size-4 rtl:rotate-180" aria-hidden="true"></span>
		{m['ProductPage.backToShop']()}
	</Link>

	{#if product.isLoading}
		<ProductLoading />
	{:else if product.error}
		<ErrorComponent message={m['ProductPage.loadError']()} />
	{:else if !product.data}
		<EmptyData
			title={m['ProductPage.notFoundTitle']()}
			description={m['ProductPage.notFoundDescription']()}
			class="min-h-80"
		/>
	{:else}
		{@const productData = product.data}
		{#if selectedProductVariant}
			{@const productVariant = selectedProductVariant}
			<article
				aria-labelledby="product-name"
				class="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:gap-x-12 lg:gap-y-8 xl:gap-x-20"
			>
				<ProductHeader product={productData} {productVariant} />
				<div class="min-w-0 lg:sticky lg:top-24 lg:col-start-1 lg:row-span-2 lg:row-start-1">
					{#key productVariant._id}
						<ImageGallery
							images={productVariant.images.length > 0 ? productVariant.images : productData.images}
							alt={productData.name}
						/>
					{/key}
				</div>
				<ProductDetails
					product={productData}
					{productVariants}
					{productVariant}
					onSelectProductVariant={(productVariantId) =>
						(selectedProductVariantId = productVariantId)}
					disabled={product.isStale}
				/>
			</article>
		{:else}
			<EmptyData
				title={m['ProductPage.notFoundTitle']()}
				description={m['ProductPage.notFoundDescription']()}
				class="min-h-80"
			/>
		{/if}
	{/if}
</Section>
