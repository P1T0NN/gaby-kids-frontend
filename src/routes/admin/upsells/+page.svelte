<script lang="ts">
	// LIBRARIES
	import { api } from '@convex/_generated/api';
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import AdminUpsellsHeader from '@/components/pages/admin/upsells/admin-upsells-header.svelte';
	import AdminUpsellsProductItem from '@/components/pages/admin/upsells/admin-upsells-product-item.svelte';
	import AdminUpsellsLoading from '@/components/pages/admin/upsells/loading/admin-upsells-loading.svelte';
	import DataList from '@/components/ui/custom-components/data-list/data-list.svelte';
	import EmptyData from '@/components/ui/custom-components/empty-data/empty-data.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import SearchInput from '@/features/search/components/search-input.svelte';

	// HOOKS
	import { useConvexPagination } from '@/features/pagination/hooks/useConvexPagination.svelte.js';
	import { useSearch } from '@/features/search/hooks/useSearch.svelte.js';

	const search = useSearch({ mode: 'state' });
	const products = useConvexPagination(
		api.tables.products.queries.fetchAllProductsAdmin.fetchAllProductsAdmin,
		() => ({ search: search.term || undefined, filters: { upsells: 'with' } }),
		{ resetKey: () => search.term }
	);
</script>

<SvelteHead title={m['AdminUpsellsPage.pageTitle']()} noindex />

<div class="flex w-full min-w-0 flex-col gap-6">
	<AdminUpsellsHeader />
	
	<DataList
		pagination={products}
		total={search.isActive ? null : products.total}
		key={(product) => product._id}
		class="divide-y"
	>
		{#snippet header()}
			{#if products.data.length > 0 || search.isActive}
				<SearchInput
					bind:value={search.value}
					placeholder={m['AdminUpsellsPage.searchPlaceholder']()}
					class="sm:max-w-md"
				/>
			{/if}
		{/snippet}

		{#snippet children(product)}
			<AdminUpsellsProductItem {product} />
		{/snippet}
		
		{#snippet loadingSnippet()}
			<AdminUpsellsLoading />
		{/snippet}

		{#snippet errorSnippet()}
			<ErrorComponent
				message={m['AdminUpsellsPage.loadError']()}
			/>
		{/snippet}

		{#snippet empty()}
			<EmptyData
				title={search.isActive
					? m['AdminUpsellsPage.noMatches']()
					: m['AdminUpsellsPage.noUpsells']()}
				description={search.isActive
					? m['AdminUpsellsPage.noMatchesDescription']()
					: m['AdminUpsellsPage.noUpsellsDescription']()}
			/>
		{/snippet}
	</DataList>
</div>
