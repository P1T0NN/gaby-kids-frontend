<script lang="ts">
	// LIBRARIES
	import { api } from '@convex/_generated/api';
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import ShopProductsHeader from '@/components/pages/(unprotected)/shop/shop-products-header.svelte';
	import ShopProductItem from '@/components/pages/(unprotected)/shop/shop-product-item.svelte';
	import ShopProductsLoading from '@/components/pages/(unprotected)/shop/loading/shop-products-loading.svelte';
	import DataList from '@/components/ui/custom-components/data-list/data-list.svelte';
	import EmptyData from '@/components/ui/custom-components/empty-data/empty-data.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
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

	const filtered = $derived(search.isActive || filters.isFiltering);

	const products = useConvexPagination(
		api.tables.products.queries.fetchAllProductsPublic.fetchAllProductsPublic,
		() => ({
			search: search.term || undefined,
			filters: filters.active
		}),
		{ pageSize: 12, resetKey: () => `${search.term}\u0000${filters.identity}` }
	);
	
	const paginationTotal = $derived(filtered ? null : products.total);
</script>

{#snippet clearFiltersIcon()}
	<span class="icon-[lucide--x] size-4" data-icon="inline-start"></span>
{/snippet}

<SvelteHead title={m['ShopPage.pageTitle']()} description={m['ShopPage.description']()} />

<Section as="main" size="sm" width="wide" containerClass="flex flex-col gap-6 sm:gap-8">
	<DataList
		pagination={products}
		total={paginationTotal}
		placement="above"
		key={(product) => product._id}
		class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
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
				action={filtered
					? {
							label: m['ShopPage.clearFilters'](),
							icon: clearFiltersIcon,
							onclick: () => {
								search.clear();
								filters.clearAll();
							}
						}
					: undefined}
			>
				{#snippet icon()}<span class="icon-[lucide--search] size-5" aria-hidden="true"
					></span>{/snippet}
			</EmptyData>
		{/snippet}
	</DataList>
</Section>
