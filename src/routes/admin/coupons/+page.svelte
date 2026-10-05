<script lang="ts">
	// CONVEX
	import { api } from '@convex/_generated/api';

	// CONFIG
	import { PAGINATION_CONFIG } from '@/shared/features/pagination/config.js';

	// COMPONENTS
	import AdminCouponsHeader from '@/components/pages/admin/coupons/admin-coupons-header.svelte';
	import AdminCouponsTableItem from '@/components/pages/admin/coupons/admin-coupons-table-item/admin-coupons-table-item.svelte';
	import AdminCouponsTableLoading from '@/components/pages/admin/coupons/loading/admin-coupons-table-loading.svelte';
	import DataTable from '@/components/ui/custom-components/data-table/data-table.svelte';
	import EmptyData from '@/components/ui/custom-components/empty-data/empty-data.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import { TableHead } from '@/components/ui/table/index.js';
	import { m } from '@/lib/paraglide/messages';

	// HOOKS
	import { useConvexPagination } from '@/features/pagination/hooks/useConvexPagination.svelte.js';

	const coupons = useConvexPagination(
		api.tables.coupons.queries.fetchCouponsAdmin.fetchCouponsAdmin,
		() => ({}),
		{ pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE }
	);
</script>

<SvelteHead title={m['AdminCouponsPage.pageTitle']()} noindex />

<div class="flex min-h-full min-w-0 flex-1 flex-col gap-6">
	<DataTable pagination={coupons} key={(coupon) => coupon._id} placement="above">
		{#snippet header()}
			<AdminCouponsHeader />
		{/snippet}

		{#snippet head()}
			<TableHead class="min-w-48">{m['AdminCouponsPage.nameColumn']()}</TableHead>
			<TableHead>{m['AdminCouponsPage.codeColumn']()}</TableHead>
			<TableHead>{m['AdminCouponsPage.discountColumn']()}</TableHead>
			<TableHead>{m['AdminCouponsPage.statusColumn']()}</TableHead>
			<TableHead>{m['AdminCouponsPage.expiryColumn']()}</TableHead>
			<TableHead>{m['AdminCouponsPage.redemptionsColumn']()}</TableHead>
			<TableHead></TableHead>
		{/snippet}

		{#snippet row(coupon)}
			<AdminCouponsTableItem {coupon} />
		{/snippet}

		{#snippet loadingSnippet()}
			<AdminCouponsTableLoading />
		{/snippet}

		{#snippet errorSnippet()}
			<ErrorComponent message={m['AdminCouponsPage.loadError']()} />
		{/snippet}

		{#snippet empty()}
			<EmptyData
				title={m['AdminCouponsPage.noCoupons']()}
				description={m['AdminCouponsPage.noCouponsDescription']()}
			/>
		{/snippet}
	</DataTable>
</div>
