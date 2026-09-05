<script lang="ts">
	// LIBRARIES
	import { api } from '@convex/_generated/api';
	import { useConvexPagination } from '@/features/pagination/hooks/useConvexPagination.svelte.js';
	import { m } from '@/lib/paraglide/messages';

	// CONFIG
	import { PAGINATION_CONFIG } from '@/shared/features/pagination/config';

	// COMPONENTS
	import AdminUsersTableItem from '@/components/pages/admin/users/admin-users-table-item.svelte';
	import DataTable from '@/components/ui/custom-components/data-table/data-table.svelte';
	import EmptyData from '@/components/ui/custom-components/empty-data/empty-data.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import { TableHead } from '@/components/ui/table';
	import AdminUsersHeader from '@/components/pages/admin/users/admin-users-header.svelte';
	import NativeSelect from '@/components/ui/native-components/native-select/native-select.svelte';
	import SearchInput from '@/features/search/components/search-input.svelte';
	import { Button } from '@/components/ui/button';

	// HOOKS
	import { useSearch } from '@/features/search/hooks/useSearch.svelte';
	import { useFilters } from '@/features/filters/hooks/useFilters.svelte';

	// DATA
	import { ADMIN_USERS_FILTER_DEFS } from '@/features/filters/data/adminUsersFilterDefs.js';

	const search = useSearch({ mode: 'state' });
	const filters = useFilters({ mode: 'state', defs: ADMIN_USERS_FILTER_DEFS });

	const users = useConvexPagination(
		api.betterAuth.tables.users.queries.fetchUsersAdmin.fetchUsersAdmin,
		() => ({
			search: search.term || undefined,
			filters: filters.active
		}),
		{
			pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
			resetKey: () => [search.term, filters.identity]
		}
	);
	const total = $derived(users.total ?? null);
	const paginationTotal = $derived(search.isActive || filters.isActive ? null : total);
</script>

<SvelteHead title={m['AdminUsersPage.pageTitle']()} noindex />

<div class="flex min-h-full min-w-0 flex-1 flex-col gap-6">
	<DataTable pagination={users} total={paginationTotal} key={(user) => user.id} placement="above">
		{#snippet header()}
			<div class="flex flex-col gap-4">
				<AdminUsersHeader {total} showTotal={!search.isActive && !filters.isActive} />
				<div class="flex flex-wrap items-center gap-2">
					<SearchInput
						bind:value={search.value}
						placeholder={m['AdminUsersPage.searchPlaceholder']()}
						class="w-full sm:max-w-sm"
					/>
					{#each filters.defs as def (def.key)}
						<NativeSelect
							options={def.options}
							value={filters.value(def.key)}
							placeholder={def.label}
							label={def.label}
							onchange={(value) => filters.set(def.key, value)}
						/>
					{/each}
					{#if filters.isActive}
						<Button variant="outline" size="sm" onclick={filters.clearAll}>
							{m['AdminUsersPage.clearFilters']({ count: filters.count })}
						</Button>
					{/if}
				</div>
			</div>
		{/snippet}

		{#snippet head()}
			<TableHead class="min-w-56">{m['AdminUsersPage.userColumn']()}</TableHead>
			<TableHead>{m['AdminUsersPage.roleColumn']()}</TableHead>
			<TableHead>{m['AdminUsersPage.statusColumn']()}</TableHead>
			<TableHead class="hidden md:table-cell">{m['AdminUsersPage.joinedColumn']()}</TableHead>
		{/snippet}

		{#snippet row(user)}
			<AdminUsersTableItem {user} />
		{/snippet}

		{#snippet errorSnippet()}
			<ErrorComponent message={m['AdminUsersPage.loadError']()} />
		{/snippet}

		{#snippet empty()}
			<EmptyData
				title={search.isActive || filters.isActive
					? m['AdminUsersPage.noMatchingUsers']()
					: m['AdminUsersPage.noUsersYet']()}
				description={search.isActive
					? m['AdminUsersPage.searchEmptyDescription']({ term: search.term })
					: filters.isActive
						? m['AdminUsersPage.filtersEmptyDescription']()
						: m['AdminUsersPage.emptyDescription']()}
			>
				{#snippet icon()}
					<span
						class={search.isActive || filters.isActive
							? 'icon-[lucide--search] size-5'
							: 'icon-[lucide--users] size-5'}
					></span>
				{/snippet}
			</EmptyData>
		{/snippet}
	</DataTable>
</div>
