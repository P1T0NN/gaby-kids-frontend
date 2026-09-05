<script lang="ts">
	// CONVEX
	import { api } from '@convex/_generated/api';

	// COMPONENTS
	import AdminEditProductForm from '@/components/pages/admin/edit-product/admin-edit-product-form.svelte';
	import AdminEditProductHeader from '@/components/pages/admin/edit-product/admin-edit-product-header.svelte';
	import AdminEditProductLoading from '@/components/pages/admin/edit-product/loading/admin-edit-product-loading.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import { m } from '@/lib/paraglide/messages';

	// HOOKS
	import { useCachedConvexQuery } from '@/hooks/useCachedConvexQuery.svelte.js';

	// TYPES
	import type { Id } from '@convex/_generated/dataModel';
	import type { PageProps } from './$types';

	let { params }: PageProps = $props();

	// SAFETY: The public route parameter is validated by Convex's v.id('products') validator.
	const product = useCachedConvexQuery(
		api.tables.products.queries.fetchProductById.fetchProductById,
		() => ({ id: params.id as Id<'products'> })
	);
</script>

<SvelteHead title={m['AdminEditProductPage.pageTitle']()} noindex />

<div class="mx-auto flex w-full max-w-4xl flex-col gap-6">
	{#if product.isLoading}
		<AdminEditProductLoading />
	{:else if product.error || !product.data}
		<ErrorComponent message={m['AdminEditProductPage.loadError']()} card />
	{:else}
		{@const productData = product.data}
		<AdminEditProductHeader productName={productData.name} />
		<AdminEditProductForm product={productData} />
	{/if}
</div>
