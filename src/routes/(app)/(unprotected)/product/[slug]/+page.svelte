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

	// TYPES
	import type { PageProps } from './$types';

	let { params }: PageProps = $props();

	const product = useCachedConvexQuery(
		api.tables.products.queries.fetchProductBySlug.fetchProductBySlug,
		() => ({ slug: params.slug })
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
		<article
			aria-labelledby="product-name"
			class="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:gap-x-12 lg:gap-y-8 xl:gap-x-20"
		>
			<ProductHeader product={product.data} />
			<div class="min-w-0 lg:sticky lg:top-24 lg:col-start-1 lg:row-span-2 lg:row-start-1">
				{#key product.data._id}
					<ImageGallery images={product.data.images} alt={product.data.name} />
				{/key}
			</div>
			<ProductDetails product={product.data} disabled={product.isStale} />
		</article>
	{/if}
</Section>
