<script lang="ts">
	// LIBRARIES
	import { api } from '@convex/_generated/api';

	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';
	import { PAGINATION_CONFIG } from '@/shared/features/pagination/config.js';

	// COMPONENTS
	import AdminProductsHeader from '@/components/pages/admin/products/admin-products-header.svelte';
	import AdminProductsTableItem from '@/components/pages/admin/products/admin-products-table-item.svelte';
	import AdminProductsTableLoading from '@/components/pages/admin/products/loading/admin-products-table-loading.svelte';
	import DataTable from '@/components/ui/custom-components/data-table/data-table.svelte';
	import EmptyData from '@/components/ui/custom-components/empty-data/empty-data.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import { TableHead } from '@/components/ui/table/index.js';
	import SearchInput from '@/features/search/components/search-input.svelte';
	import { m } from '@/lib/paraglide/messages';

	// HOOKS
	import { useConvexPagination } from '@/features/pagination/hooks/useConvexPagination.svelte.js';
	import { useSearch } from '@/features/search/hooks/useSearch.svelte.js';

	const search = useSearch({ mode: 'state' });

	const products = useConvexPagination(
		api.tables.products.queries.fetchAllProductsAdmin.fetchAllProductsAdmin,
		() => ({ search: search.term || undefined }),
		{
			pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
			resetKey: () => search.term
		}
	);

	const total = $derived(products.total ?? null);
	const paginationTotal = $derived(search.isActive ? null : total);
</script>

<SvelteHead title={m['AdminProductsPage.pageTitle']()} noindex />

<div class="flex min-h-full min-w-0 flex-1 flex-col gap-6">
	<DataTable
		pagination={products}
		total={paginationTotal}
		key={(product) => product._id}
		placement="above"
	>
		{#snippet header()}
			<div class="flex flex-col gap-4">
				<AdminProductsHeader {total} showTotal={!search.isActive} />
				<SearchInput
					bind:value={search.value}
					placeholder={m['AdminProductsPage.searchPlaceholder']()}
					class="w-full sm:max-w-sm"
				/>
			</div>
		{/snippet}

		{#snippet head()}
			<TableHead class="min-w-64">{m['AdminProductsPage.productColumn']()}</TableHead>
			<TableHead>{m['AdminProductsPage.categoryColumn']()}</TableHead>
			<TableHead class="hidden md:table-cell">{m['AdminProductsPage.createdColumn']()}</TableHead>
			<TableHead class="w-12">
				<span class="sr-only">{m['AdminProductsPage.actionsColumn']()}</span>
			</TableHead>
		{/snippet}

		{#snippet row(product)}
			<AdminProductsTableItem {product} />
		{/snippet}

		{#snippet loadingSnippet()}
			<AdminProductsTableLoading />
		{/snippet}

		{#snippet errorSnippet()}
			<ErrorComponent message={m['AdminProductsPage.loadError']()} />
		{/snippet}

		{#snippet empty()}
			<EmptyData
				title={search.isActive
					? m['AdminProductsPage.noMatchingProducts']()
					: m['AdminProductsPage.noProductsYet']()}
				description={search.isActive
					? m['AdminProductsPage.searchEmptyDescription']({ term: search.term })
					: m['AdminProductsPage.emptyDescription']()}
				action={search.isActive
					? undefined
					: {
							label: m['AdminProductsPage.addProduct'](),
							href: ADMIN_PAGE_ENDPOINTS.ADD_PRODUCT
						}}
			>
				{#snippet icon()}
					<span
						class={search.isActive
							? 'icon-[lucide--search] size-5'
							: 'icon-[lucide--package] size-5'}
						aria-hidden="true"
					></span>
				{/snippet}
			</EmptyData>
		{/snippet}
	</DataTable>
</div>
