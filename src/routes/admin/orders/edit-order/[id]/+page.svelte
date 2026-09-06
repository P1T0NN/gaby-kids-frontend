<script lang="ts">
	// LIBRARIES
	import { api } from '@convex/_generated/api';

	// COMPONENTS
	import AdminEditOrderActions from '@/components/pages/admin/edit-order/admin-edit-order-actions.svelte';
	import AdminEditOrderHeader from '@/components/pages/admin/edit-order/admin-edit-order-header.svelte';
	import AdminEditOrderLoading from '@/components/pages/admin/edit-order/loading/admin-edit-order-loading.svelte';
	import AdminEditOrderSummary from '@/components/pages/admin/edit-order/admin-edit-order-summary.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import { m } from '@/lib/paraglide/messages';

	// HOOKS
	import { useCachedConvexQuery } from '@/hooks/useCachedConvexQuery.svelte.js';

	// TYPES
	import type { Id } from '@convex/_generated/dataModel';
	import type { PageProps } from './$types';

	let { params }: PageProps = $props();

	// SAFETY: Convex validates the public route parameter with v.id('orders').
	const order = useCachedConvexQuery(
		api.tables.orders.queries.fetchOrderAdmin.fetchOrderAdmin,
		() => ({ id: params.id as Id<'orders'> })
	);
</script>

<SvelteHead title={m['AdminEditOrderPage.pageTitle']()} noindex />

<div class="mx-auto flex w-full max-w-6xl flex-col gap-6">
	{#if order.isLoading}
		<AdminEditOrderLoading />
	{:else if order.error || !order.data}
		<ErrorComponent message={m['AdminEditOrderPage.loadError']()} card />
	{:else}
		<AdminEditOrderHeader orderId={order.data.order._id} />
		<AdminEditOrderActions order={order.data.order} />
		<AdminEditOrderSummary order={order.data.order} items={order.data.items} />
	{/if}
</div>
