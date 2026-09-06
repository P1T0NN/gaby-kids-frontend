<script lang="ts">
	// LIBRARIES
	import { api } from '@convex/_generated/api';
	import { m } from '@/lib/paraglide/messages';

	// CONFIG
	import { PAGINATION_CONFIG } from '@/shared/features/pagination/config.js';

	// COMPONENTS
	import AdminOrdersHeader from '@/components/pages/admin/orders/admin-orders-header.svelte';
	import AdminOrdersTableItem from '@/components/pages/admin/orders/admin-orders-table-item.svelte';
	import AdminOrdersTableLoading from '@/components/pages/admin/orders/loading/admin-orders-table-loading.svelte';
	import DataTable from '@/components/ui/custom-components/data-table/data-table.svelte';
	import EmptyData from '@/components/ui/custom-components/empty-data/empty-data.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import { TableHead } from '@/components/ui/table/index.js';

	// HOOKS
	import { useFilters } from '@/features/filters/hooks/useFilters.svelte.js';
	import { useConvexPagination } from '@/features/pagination/hooks/useConvexPagination.svelte.js';

	// DATA
	import { ADMIN_ORDERS_FILTER_DEFS } from '@/features/filters/data/adminOrdersFilterDefs.js';

	const filters = useFilters({ mode: 'state', defs: ADMIN_ORDERS_FILTER_DEFS });

	const orders = useConvexPagination(
		api.tables.orders.queries.fetchAllOrdersAdmin.fetchAllOrdersAdmin,
		() => ({ filters: filters.active }),
		{
			pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
			resetKey: () => filters.identity
		}
	);
</script>

<SvelteHead title={m['AdminOrdersPage.pageTitle']()} noindex />

<div class="flex min-h-full min-w-0 flex-1 flex-col gap-6">
	<DataTable pagination={orders} key={(order) => order._id} placement="above">
		{#snippet header()}<AdminOrdersHeader {filters} />{/snippet}
		{#snippet head()}
			<TableHead>{m['AdminOrdersPage.orderColumn']()}</TableHead>
			<TableHead class="min-w-56">{m['AdminOrdersPage.customerColumn']()}</TableHead>
			<TableHead>{m['AdminOrdersPage.totalColumn']()}</TableHead>
			<TableHead>{m['AdminOrdersPage.paymentColumn']()}</TableHead>
			<TableHead>{m['AdminOrdersPage.fulfillmentColumn']()}</TableHead>
			<TableHead class="hidden lg:table-cell">{m['AdminOrdersPage.createdColumn']()}</TableHead>
			<TableHead class="w-24"
				><span class="sr-only">{m['AdminOrdersPage.actionsColumn']()}</span></TableHead
			>
		{/snippet}
		{#snippet row(order)}<AdminOrdersTableItem {order} />{/snippet}
		{#snippet loadingSnippet()}<AdminOrdersTableLoading />{/snippet}
		{#snippet errorSnippet()}<ErrorComponent message={m['AdminOrdersPage.loadError']()} />{/snippet}
		{#snippet empty()}
			<EmptyData
				title={filters.isActive
					? m['AdminOrdersPage.noMatchingOrders']()
					: m['AdminOrdersPage.noOrders']()}
				description={filters.isActive
					? m['AdminOrdersPage.filtersEmptyDescription']()
					: m['AdminOrdersPage.noOrdersDescription']()}
			>
				{#snippet icon()}
					<span
						class={filters.isActive
							? 'icon-[lucide--search] size-5'
							: 'icon-[lucide--shopping-bag] size-5'}
						aria-hidden="true"
					></span>
				{/snippet}
			</EmptyData>
		{/snippet}
	</DataTable>
</div>
