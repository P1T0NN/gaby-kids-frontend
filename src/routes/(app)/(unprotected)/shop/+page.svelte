<script lang="ts">
	// LIBRARIES
	import { onMount } from 'svelte';
	import { api } from '@convex/_generated/api';
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import ShopProductsHeader from '@/components/pages/shop/shop-products-header.svelte';
	import ShopProductItem from '@/components/pages/shop/shop-product-item.svelte';
	import ShopProductsLoading from '@/components/pages/shop/loading/shop-products-loading.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import DataList from '@/components/ui/custom-components/data-list/data-list.svelte';
	import EmptyData from '@/components/ui/custom-components/empty-data/empty-data.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import PaginatedData from '@/components/ui/custom-components/paginated-data/paginated-data.svelte';
	import Section from '@/components/ui/custom-components/section/section.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';

	// CONFIG
	import { SHOP_PRODUCT_FILTER_DEFS } from '@/features/filters/data/shopProductFilterDefs.js';

	// HOOKS
	import { useFilters } from '@/features/filters/hooks/useFilters.svelte.js';
	import { useSearch } from '@/features/search/hooks/useSearch.svelte.js';
	import { useConvexPagination } from '@/features/pagination/hooks/useConvexPagination.svelte.js';

	const search = useSearch({ mode: 'url' });
	const filters = useFilters({ mode: 'url', defs: SHOP_PRODUCT_FILTER_DEFS });
	let asOf = $state<number>();
	onMount(() => {
		asOf = Date.now();
	});
	const filtered = $derived(search.isActive || filters.isActive);
	const products = useConvexPagination(
		api.tables.products.queries.fetchAllProductsPublic.fetchAllProductsPublic,
		() => ({
			search: search.term || undefined,
			filters: filters.active,
			asOf: filters.active.added ? asOf : undefined
		}),
		{ pageSize: 12, resetKey: () => `${search.term}\u0000${filters.identity}` }
	);
</script>

<SvelteHead title={m['ShopPage.pageTitle']()} description={m['ShopPage.description']()} />

<Section as="main" size="sm" width="wide" containerClass="flex flex-col gap-6 sm:gap-8">
	<DataList
		pagination={products}
		showPagination={false}
		key={(product) => product._id}
		class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
	>
		{#snippet header()}
			<ShopProductsHeader
				total={products.total}
				loading={products.loading}
				error={products.error}
				{search}
				{filters}
			/>
		{/snippet}
		{#snippet children(product)}
			<ShopProductItem {product} />
		{/snippet}
		{#snippet loadingSnippet()}
			<ShopProductsLoading />
		{/snippet}
		{#snippet errorSnippet()}
			<ErrorComponent message={m['ShopPage.loadError']()} />
		{/snippet}
		{#snippet empty()}
			<div class="flex flex-col items-center gap-2 py-8">
				<EmptyData
					title={products.nextCursor
						? m['ShopPage.noPageMatches']()
						: filtered
							? m['ShopPage.noMatches']()
							: m['ShopPage.emptyTitle']()}
					description={products.nextCursor
						? m['ShopPage.noPageMatchesDescription']()
						: filtered
							? m['ShopPage.noMatchesDescription']()
							: m['ShopPage.emptyDescription']()}
				>
					{#snippet icon()}<span class="icon-[lucide--search] size-5" aria-hidden="true"
						></span>{/snippet}
				</EmptyData>
				{#if filtered}
					<Button
						variant="outline"
						onclick={() => {
							search.clear();
							filters.clearAll();
						}}>{m['ShopPage.clearFilters']()}</Button
					>
				{/if}
			</div>
		{/snippet}
	</DataList>
	{#if products.data.length > 0 || products.nextCursor || products.page > 1}
		<PaginatedData
			page={products.page}
			nextCursor={products.nextCursor}
			total={filtered ? undefined : products.total}
			pageSize={12}
			loading={products.loading}
			onPrev={products.onPrev}
			onNext={products.onNext}
		/>
	{/if}
</Section>
