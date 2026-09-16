<script lang="ts">
	// LIBRARIES
	import { useQuery } from 'convex-svelte';
	import { api } from '@convex/_generated/api';
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import CheckoutSummaryItem from '@/components/pages/(unprotected)/checkout/checkout-summary-item.svelte';
	import CheckoutSummaryLoading from '@/components/pages/(unprotected)/checkout/loading/checkout-summary-loading.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import EmptyData from '@/components/ui/custom-components/empty-data/empty-data.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';

	// HOOKS
	import { useCart } from '@/features/cart/hooks/useCart.svelte.js';

	// UTILS
	import {
		calculateOrderSavingsInCents,
		calculateOrderTotalInCents,
		formatPrice
	} from '@/shared/utils/pricing.js';

	// TYPES
	import type { MutationValues } from '@/components/ui/custom-components/form/formTypes.js';

	type CreateStripeCheckoutAction =
		typeof api.stripe.actions.createStripeCheckout.createStripeCheckout;

	type Props = {
		values: MutationValues<CreateStripeCheckoutAction>;
		submitting: boolean;
	};

	let { values, submitting }: Props = $props();

	const fulfillment = $derived(values.fulfillmentMethod === 'pickup' ? 'pickup' : 'delivery');

	const cart = useCart();

	const products = useQuery(api.tables.products.queries.fetchCart.fetchCart, () =>
		cart.loaded && !cart.error && cart.items.length
			? { ids: cart.items.map((item) => item.id) }
			: 'skip'
	);

	const items = $derived(
		cart.items.flatMap((item) => {
			const product = products.data?.products.find((product) => product.id === item.id);
			return product ? [{ ...item, ...product }] : [];
		})
	);

	const pricingItems = $derived(
		items.map((item) => ({
			unitPriceInCents: item.priceInCents,
			compareAtPriceInCents: item.compareAtPriceInCents,
			quantity: item.quantity
		}))
	);
	const total = $derived(calculateOrderTotalInCents(pricingItems));
	const totalSavingsInCents = $derived(calculateOrderSavingsInCents(pricingItems));

	const loading = $derived(!cart.loaded || products.isLoading || products.isStale);
</script>

<aside
	aria-labelledby="order-summary"
	class="rounded-2xl border bg-muted/20 p-5 sm:p-6 lg:sticky lg:top-24"
>
	<h2 id="order-summary" class="mb-6 text-xl font-semibold">
		{m['CheckoutPage.CheckoutSummary.summary']()}
	</h2>
	{#if cart.error || products.error}
		<ErrorComponent message={m['CartFeature.Cart.loadError']()} />
	{:else if cart.loaded && cart.items.length === 0}
		<EmptyData
			title={m['CartFeature.Cart.emptyTitle']()}
			description={m['CartFeature.Cart.emptyDescription']()}
		/>
	{:else if loading}
		<CheckoutSummaryLoading />
	{:else if products.data?.invalidIds.length}
		<p role="alert" class="mb-4 text-sm">{m['CheckoutPage.CheckoutSummary.unavailable']()}</p>
		<Button
			variant="outline"
			class="h-auto min-h-11 whitespace-normal"
			onclick={() => cart.removeInvalidItems(products.data?.invalidIds ?? [])}
			>{m['CheckoutPage.CheckoutSummary.removeUnavailable']()}</Button
		>
	{:else}
		<ul class="divide-y divide-border">
			{#each items as item (item.id)}<CheckoutSummaryItem {item} />{/each}
		</ul>
		<dl class="flex flex-col gap-3 border-t pt-5 text-sm">
			<div class="flex justify-between gap-4">
				<dt class="text-muted-foreground">{m['CheckoutPage.CheckoutSummary.subtotal']()}</dt>
				<dd class="tabular-nums">{formatPrice(total)}</dd>
			</div>
			{#if totalSavingsInCents > 0}
				<div class="flex justify-between gap-4 text-success">
					<dt>{m['CheckoutPage.CheckoutSummary.youSave']()}</dt>
					<dd class="font-medium tabular-nums">{formatPrice(totalSavingsInCents)}</dd>
				</div>
			{/if}
			<div class="flex justify-between gap-4">
				<dt class="text-muted-foreground">
					{fulfillment === 'delivery'
						? m['CheckoutPage.CheckoutSummary.delivery']()
						: m['CheckoutPage.CheckoutSummary.pickup']()}
				</dt>
				<dd class="text-right">
					{fulfillment === 'delivery'
						? m['CheckoutPage.CheckoutSummary.deliveryPending']()
						: formatPrice(0)}
				</dd>
			</div>
			<div class="mt-2 flex items-baseline justify-between gap-4 border-t pt-5 font-semibold">
				<dt>
					{fulfillment === 'delivery'
						? m['CheckoutPage.CheckoutSummary.estimatedTotal']()
						: m['CheckoutPage.CheckoutSummary.total']()}
				</dt>
				<dd class="text-2xl tracking-tight tabular-nums">{formatPrice(total)}</dd>
			</div>
		</dl>
	{/if}
	<Button
		type="submit"
		form="checkout-form"
		disabled={loading || submitting || cart.items.length === 0}
		class="mt-6 h-12 w-full"
		aria-describedby="payment-status"
	>
		<span class="icon-[lucide--lock-keyhole] size-4" aria-hidden="true"></span>
		{submitting
			? m['CheckoutPage.CheckoutSummary.creatingOrder']()
			: m['CheckoutPage.CheckoutSummary.continue']()}
	</Button>
	<p id="payment-status" class="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
		{m['CheckoutPage.CheckoutSummary.paymentUnavailable']()}
	</p>
</aside>
