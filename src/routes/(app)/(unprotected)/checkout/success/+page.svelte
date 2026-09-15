<script lang="ts">
	// SVELTEKIT IMPORTS
	import { page } from '$app/state';

	// LIBRARIES
	import { useQuery } from 'convex-svelte';
	import { untrack } from 'svelte';
	import { api } from '@convex/_generated/api';
	import { m } from '@/lib/paraglide/messages';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints';

	// COMPONENTS
	import CheckoutSuccessHeader from '@/components/pages/(unprotected)/checkout-success/CheckoutSuccessHeader.svelte';
	import CheckoutSuccessOrderDetails from '@/components/pages/(unprotected)/checkout-success/CheckoutSuccessOrderDetails.svelte';
	import CheckoutSuccessOrderSummary from '@/components/pages/(unprotected)/checkout-success/CheckoutSuccessOrderSummary.svelte';
	import CheckoutSuccessLoading from '@/components/pages/(unprotected)/checkout-success/loading/CheckoutSuccessLoading.svelte';
	import ButtonLink from '@/components/ui/custom-components/button-link/button-link.svelte';
	import EmptyData from '@/components/ui/custom-components/empty-data/empty-data.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import Section from '@/components/ui/custom-components/section/section.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';

	// HOOKS
	import { useCart } from '@/features/cart/hooks/useCart.svelte.js';
	import { useOrdersLocal } from '@/features/orders/hooks/useOrdersLocal.svelte.js';

	const cart = useCart();
	const localOrders = useOrdersLocal();
	const receiptToken = $derived(page.url.searchParams.get('key') ?? '');
	const returnedFromStripe = $derived(!!page.url.searchParams.get('session_id'));

	const order = useQuery(api.tables.orders.queries.fetchOrderReceipt.fetchOrderReceipt, () =>
		receiptToken ? { receiptToken } : 'skip'
	);

	// Persist access when the paid receipt mounts, including receipts opened from email.
	function saveReceipt(): void {
		const receipt = order.data;
		const key = receiptToken;
		if (!receipt || receipt.order.paymentStatus === 'pending') return;
		untrack(() => {
			const firstVisit = localOrders.addOrderLocal(receipt.order._id, key);
			if (firstVisit && returnedFromStripe) cart.replaceItems([]);
		});
	}
</script>

<SvelteHead
	title={m['CheckoutSuccessPage.title']()}
	description={m['CheckoutSuccessPage.description']()}
	noindex
/>

{#snippet notFound()}
	<EmptyData
		card
		title={m['CheckoutSuccessPage.notFoundTitle']()}
		description={m['CheckoutSuccessPage.notFoundDescription']()}
	/>
	<div class="flex justify-center">
		<ButtonLink href="/shop">
			<span class="icon-[lucide--arrow-left] size-4" aria-hidden="true"></span>
			{m['CheckoutSuccessPage.back']()}
		</ButtonLink>
	</div>
{/snippet}

<Section as="main" size="sm" width="wide" containerClass="flex flex-col gap-8">
	{#if !receiptToken}
		{@render notFound()}
	{:else if order.error}
		<ErrorComponent message={m['CheckoutSuccessPage.loadError']()} card />
	{:else if order.isLoading || !order.data}
		{#if order.data === null && !returnedFromStripe}
			{@render notFound()}
		{:else}
			<CheckoutSuccessLoading />
			<p role="status" class="text-center text-muted-foreground">
				{m['CheckoutSuccessPage.paymentPendingHint']()}
			</p>
			<ButtonLink href={UNPROTECTED_PAGE_ENDPOINTS.SHOP}>
				{m['CheckoutSuccessPage.back']()}
			</ButtonLink>
		{/if}
	{:else if order.data.order.paymentStatus === 'pending'}
		<p role="status">{m['CheckoutSuccessPage.paymentPendingHint']()}</p>
	{:else}
		<CheckoutSuccessHeader order={order.data.order} />

		<CheckoutSuccessOrderSummary order={order.data.order} items={order.data.items} />

		<CheckoutSuccessOrderDetails order={order.data.order} />

		<div class="flex justify-center" {@attach saveReceipt}>
			<ButtonLink href={UNPROTECTED_PAGE_ENDPOINTS.SHOP}>
				<span class="icon-[lucide--arrow-left] size-4" aria-hidden="true"></span>
				{m['CheckoutSuccessPage.back']()}
			</ButtonLink>
		</div>
	{/if}
</Section>
