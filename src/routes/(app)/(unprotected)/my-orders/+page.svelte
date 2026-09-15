<script lang="ts">
	// LIBRARIES
	import { untrack } from 'svelte';
	import { api } from '@convex/_generated/api';
	import { m } from '@/lib/paraglide/messages';

	// CONFIG
	import { PAGINATION_CONFIG } from '@/shared/features/pagination/config.js';

	// COMPONENTS
	import MyOrdersHeader from '@/components/pages/(unprotected)/my-orders/my-orders-header.svelte';
	import MyOrdersItem from '@/components/pages/(unprotected)/my-orders/my-orders-item.svelte';
	import MyOrdersLoading from '@/components/pages/(unprotected)/my-orders/loading/my-orders-loading.svelte';
	import DataList from '@/components/ui/custom-components/data-list/data-list.svelte';
	import EmptyData from '@/components/ui/custom-components/empty-data/empty-data.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import Section from '@/components/ui/custom-components/section/section.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';

	// HOOKS
	import { useConvexPagination } from '@/features/pagination/hooks/useConvexPagination.svelte.js';
	import { useFilters } from '@/features/filters/hooks/useFilters.svelte.js';
	import { useOrdersLocal } from '@/features/orders/hooks/useOrdersLocal.svelte.js';

	// DATA
	import { MY_ORDERS_FILTER_DEFS } from '@/features/filters/data/myOrdersFilterDefs.js';

	// TYPES
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const authenticated = $derived(data.authState.isAuthenticated);
	const localOrders = useOrdersLocal();
	const filters = useFilters({ mode: 'state', defs: MY_ORDERS_FILTER_DEFS });

	const orders = useConvexPagination(
		api.tables.orders.queries.fetchMyOrders.fetchMyOrders,
		() => ({
			guestOrders: authenticated ? undefined : localOrders.ordersLocal,
			filters: filters.active
		}),
		{
			pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
			resetKey: () => filters.identity
		}
	);

	// Deliberate `$effect`: this is external synchronization, not derived state. The reactive
	// query result drives localStorage both ways — signed-in users mirror their server orders in,
	// guests remove ids the server reports as stale — and `useQuery` has no success callback, so
	// an effect is the only way to react. The writes run inside `untrack` because `addOrderLocal`/
	// `removeOrdersLocal` read and write `localOrders` through `useLocalStorage.read()`, which would
	// otherwise make the effect read and write the same state and loop forever.
	$effect(() => {
		const page = orders.result.data;
		if (!page) return;

		if (authenticated) {
			const syncOrders = page.syncOrders;
			untrack(() => {
				for (const access of syncOrders) localOrders.addOrderLocal(access.id, access.receiptToken);
			});
		} else {
			const invalidOrderIds = page.invalidOrderIds;
			untrack(() => {
				if (invalidOrderIds.length) localOrders.removeOrdersLocal(invalidOrderIds);
			});
		}
	});
</script>

<SvelteHead
	title={m['MyOrdersPage.pageTitle']()}
	description={m['MyOrdersPage.pageDescription']()}
	noindex
/>

<Section as="main" size="md" width="wide" containerClass="flex flex-col gap-10">
	<MyOrdersHeader {authenticated} {filters} />

	<div class="rounded-2xl border bg-card p-5 shadow-sm sm:p-7">
		{#if !authenticated && !localOrders.loadedLocal}
			<MyOrdersLoading />
		{:else if !authenticated && localOrders.errorLocal}
			<ErrorComponent message={m['MyOrdersPage.storageError']()} />
		{:else}
			<DataList pagination={orders} key={(order) => order._id} showPagination={false} class="gap-4">
				{#snippet children(order)}
					<MyOrdersItem {order} />
				{/snippet}

				{#snippet loadingSnippet()}
					<MyOrdersLoading />
				{/snippet}

				{#snippet errorSnippet()}
					<ErrorComponent message={m['MyOrdersPage.loadError']()} />
				{/snippet}

				{#snippet empty()}
					<EmptyData
						title={filters.isActive
							? m['MyOrdersPage.noMatchingOrders']()
							: m['MyOrdersPage.emptyTitle']()}
						description={filters.isActive
							? m['MyOrdersPage.filtersEmptyDescription']()
							: authenticated
								? m['MyOrdersPage.signedInEmptyDescription']()
								: m['MyOrdersPage.guestEmptyDescription']()}
					>
						{#snippet icon()}
							<span
								class={filters.isActive
									? 'icon-[lucide--search] size-5'
									: 'icon-[lucide--package-open] size-5'}
								aria-hidden="true"
							></span>
						{/snippet}
					</EmptyData>
				{/snippet}
			</DataList>
		{/if}
	</div>
</Section>
