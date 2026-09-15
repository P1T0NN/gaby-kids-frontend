<script lang="ts">
	// SVELTEKIT IMPORTS
	import { page } from '$app/state';

	// LIBRARIES
	import { api } from '@convex/_generated/api';
	import { m } from '@/lib/paraglide/messages';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// COMPONENTS
	import CheckoutSuccessOrderDetails from '@/components/pages/(unprotected)/checkout-success/CheckoutSuccessOrderDetails.svelte';
	import CheckoutSuccessOrderSummary from '@/components/pages/(unprotected)/checkout-success/CheckoutSuccessOrderSummary.svelte';
	import MyOrderHeader from '@/components/pages/(unprotected)/my-orders/my-order-header.svelte';
	import MyOrderLoading from '@/components/pages/(unprotected)/my-orders/loading/my-order-loading.svelte';
	import ButtonLink from '@/components/ui/custom-components/button-link/button-link.svelte';
	import EmptyData from '@/components/ui/custom-components/empty-data/empty-data.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import Section from '@/components/ui/custom-components/section/section.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';

	// HOOKS
	import { useCachedConvexQuery } from '@/hooks/useCachedConvexQuery.svelte.js';
	import { useOrdersLocal } from '@/features/orders/hooks/useOrdersLocal.svelte.js';

	// TYPES
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const authenticated = $derived(data.authState.isAuthenticated);
	const code = $derived((page.params.code ?? '').toUpperCase());

	const localOrders = useOrdersLocal(() => !authenticated);
	const ready = $derived(authenticated || localOrders.loadedLocal);

	const order = useCachedConvexQuery(api.tables.orders.queries.fetchMyOrder.fetchMyOrder, () =>
		ready ? { code, guestOrders: authenticated ? undefined : localOrders.ordersLocal } : 'skip'
	);
</script>

<SvelteHead title={m['MyOrderPage.pageTitle']({ code })} noindex />

<Section as="main" size="md" width="wide">
	{#if !ready || order.isLoading}
		<MyOrderLoading />
	{:else if localOrders.errorLocal && !authenticated}
		<ErrorComponent message={m['MyOrderPage.storageError']()} card />
	{:else if order.error}
		<ErrorComponent message={m['MyOrderPage.loadError']()} card />
	{:else if !order.data}
		<div class="flex flex-col gap-6">
			<EmptyData
				card
				title={m['MyOrderPage.notFoundTitle']()}
				description={m['MyOrderPage.notFoundDescription']()}
			/>

			<div class="flex justify-center">
				<ButtonLink href={UNPROTECTED_PAGE_ENDPOINTS.MY_ORDERS}
					>{m['MyOrderPage.back']()}</ButtonLink
				>
			</div>
		</div>
	{:else}
		<div class="flex flex-col gap-7">
			<MyOrderHeader order={order.data.order} />
			<CheckoutSuccessOrderSummary order={order.data.order} items={order.data.items} />
			<CheckoutSuccessOrderDetails order={order.data.order} />
		</div>
	{/if}
</Section>
