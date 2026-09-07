<script lang="ts">
	// SVELTEKIT IMPORTS
	import { page } from '$app/state';

	// LIBRARIES
	import { useQuery } from 'convex-svelte';
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

	const retryKey = $derived(page.url.searchParams.get('key') ?? '');

	const order = useQuery(api.tables.orders.queries.fetchOrderReceipt.fetchOrderReceipt, () =>
		retryKey ? { retryKey } : 'skip'
	);
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
	{#if !retryKey || order.data === null}
		{@render notFound()}
	{:else if order.error}
		<ErrorComponent message={m['CheckoutSuccessPage.loadError']()} card />
	{:else if order.isLoading || !order.data}
		<CheckoutSuccessLoading />
	{:else}
		<CheckoutSuccessHeader order={order.data.order} />

		<p
			class="flex items-start gap-2 rounded-xl border bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground"
			role="note"
		>
			<span class="mt-0.5 icon-[lucide--info] size-4 shrink-0" aria-hidden="true"></span>
			{m['CheckoutSuccessPage.paymentPendingHint']()}
		</p>

		<CheckoutSuccessOrderSummary order={order.data.order} items={order.data.items} />

		<CheckoutSuccessOrderDetails order={order.data.order} />

		<div class="flex justify-center">
			<ButtonLink href={UNPROTECTED_PAGE_ENDPOINTS.SHOP}>
				<span class="icon-[lucide--arrow-left] size-4" aria-hidden="true"></span>
				{m['CheckoutSuccessPage.back']()}
			</ButtonLink>
		</div>
	{/if}
</Section>
