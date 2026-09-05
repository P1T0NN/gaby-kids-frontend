<script lang="ts">
	// CONVEX
	import { api } from '@convex/_generated/api';

	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';
	import { PAGINATION_CONFIG } from '@/shared/features/pagination/config.js';

	// COMPONENTS
	import AdminCategoriesHeader from '@/components/pages/admin/categories/admin-categories-header.svelte';
	import AdminCategoriesTableItem from '@/components/pages/admin/categories/admin-categories-table-item.svelte';
	import AdminCategoriesTableLoading from '@/components/pages/admin/categories/loading/admin-categories-table-loading.svelte';
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

	const categories = useConvexPagination(
		api.tables.categories.queries.fetchCategoriesAdmin.fetchCategoriesAdmin,
		() => ({ search: search.term || undefined }),
		{
			pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
			resetKey: () => search.term
		}
	);
</script>

<SvelteHead title={m['AdminCategoriesPage.pageTitle']()} noindex />

<div class="flex min-h-full min-w-0 flex-1 flex-col gap-6">
	<DataTable pagination={categories} key={(category) => category._id} placement="above">
		{#snippet header()}
			<div class="flex flex-col gap-4">
				<AdminCategoriesHeader showTotal={!search.isActive} />
				<SearchInput
					bind:value={search.value}
					placeholder={m['AdminCategoriesPage.searchPlaceholder']()}
					class="w-full sm:max-w-sm"
				/>
			</div>
		{/snippet}

		{#snippet head()}
			<TableHead class="min-w-64">{m['AdminCategoriesPage.nameColumn']()}</TableHead>
			<TableHead>{m['AdminCategoriesPage.slugColumn']()}</TableHead>
			<TableHead>{m['AdminCategoriesPage.statusColumn']()}</TableHead>
			<TableHead class="w-12">
				<span class="sr-only">{m['AdminCategoriesPage.actionsColumn']()}</span>
			</TableHead>
		{/snippet}

		{#snippet row(category)}
			<AdminCategoriesTableItem {category} />
		{/snippet}

		{#snippet loadingSnippet()}
			<AdminCategoriesTableLoading />
		{/snippet}

		{#snippet errorSnippet()}
			<ErrorComponent message={m['AdminCategoriesPage.loadError']()} />
		{/snippet}

		{#snippet empty()}
			<EmptyData
				title={search.isActive
					? m['AdminCategoriesPage.noMatchingCategories']()
					: m['AdminCategoriesPage.noCategoriesYet']()}
				description={search.isActive
					? m['AdminCategoriesPage.searchEmptyDescription']({ term: search.term })
					: m['AdminCategoriesPage.emptyDescription']()}
				action={search.isActive
					? undefined
					: {
							label: m['AdminCategoriesPage.addCategory'](),
							href: ADMIN_PAGE_ENDPOINTS.ADD_CATEGORY
						}}
			>
				{#snippet icon()}
					<span
						class={search.isActive
							? 'icon-[lucide--search] size-5'
							: 'icon-[lucide--folder] size-5'}
						aria-hidden="true"
					></span>
				{/snippet}
			</EmptyData>
		{/snippet}
	</DataTable>
</div>
