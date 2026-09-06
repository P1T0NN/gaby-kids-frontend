<script lang="ts">
	// LIBRARIES
	import { useMutation, useQuery } from 'convex-svelte';
	import { api } from '@convex/_generated/api';
	import { m } from '@/lib/paraglide/messages';
	// COMPONENTS
	import CheckoutHeader from '@/components/pages/(unprotected)/checkout/checkout-header.svelte';
	import CheckoutSummaryItem from '@/components/pages/(unprotected)/checkout/checkout-summary-item.svelte';
	import CheckoutSummaryLoading from '@/components/pages/(unprotected)/checkout/loading/checkout-summary-loading.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import { Input } from '@/components/ui/input/index.js';
	import { Label } from '@/components/ui/label/index.js';
	import Section from '@/components/ui/custom-components/section/section.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import EmptyData from '@/components/ui/custom-components/empty-data/empty-data.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	// HOOKS
	import { useCart } from '@/features/cart/hooks/useCart.svelte.js';
	// UTILS
	import { calculateCartTotal } from '@/shared/features/cart/utils/calculateCartTotal.js';
	import { formatPrice } from '@/shared/features/cart/utils/formatPrice.js';
	import { toastMessage } from '@/utils/toastMessage.js';
	import type { Id } from '@convex/_generated/dataModel';

	const cart = useCart();
	const createOrder = useMutation(api.tables.orders.mutations.createOrder.createOrder);
	let fulfillment = $state('delivery');
	let firstName = $state('');
	let lastName = $state('');
	let email = $state('');
	let phone = $state('');
	let street = $state('');
	let apartment = $state('');
	let postalCode = $state('');
	let city = $state('');
	let country = $state('');
	let retryKey = $state('');
	let submitting = $state(false);
	let createdOrderId = $state<Id<'orders'> | null>(null);
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
	const total = $derived(
		calculateCartTotal(
			items.map((item) => ({
				price: item.priceInCents,
				discount: 0,
				quantity: item.quantity
			}))
		)
	);
	const loading = $derived(!cart.loaded || products.isLoading || products.isStale);

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (submitting || loading || cart.items.length === 0) return;
		if (!retryKey) retryKey = crypto.randomUUID();
		submitting = true;
		try {
			// SAFETY: Convex validates every submitted cart ID with v.id('products').
			createdOrderId = await createOrder({
				retryKey,
				items: cart.items.map((item) => ({
					productId: item.id as Id<'products'>,
					quantity: item.quantity
				})),
				firstName,
				lastName,
				email,
				phone,
				fulfillmentMethod: fulfillment === 'pickup' ? 'pickup' : 'delivery',
				shippingAddress:
					fulfillment === 'delivery'
						? { street, apartment: apartment || undefined, postalCode, city, country }
						: undefined
			});
			cart.replaceItems([]);
			toastMessage({ type: 'success', message: m['CheckoutPage.orderCreated']() });
		} catch (error) {
			toastMessage({ type: 'error', error, message: m['CheckoutPage.orderCreateError']() });
		} finally {
			submitting = false;
		}
	}
</script>

<SvelteHead
	title={m['CheckoutPage.title']()}
	description={m['CheckoutPage.description']()}
	noindex
/>

<Section as="main" size="sm" width="wide" containerClass="flex flex-col gap-10">
	<CheckoutHeader />
	<div class="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-16">
		<form id="checkout-form" class="flex min-w-0 flex-col gap-9" onsubmit={handleSubmit}>
			<fieldset class="flex min-w-0 flex-col gap-5">
				<legend class="mb-2 text-xl font-semibold">{m['CheckoutPage.contact']()}</legend>
				<p class="text-sm text-muted-foreground">{m['CheckoutPage.contactHint']()}</p>
				<div class="grid gap-5 sm:grid-cols-2">
					<div class="flex flex-col gap-2">
						<Label for="first-name">{m['CheckoutPage.firstName']()}</Label><Input
							id="first-name"
							name="firstName"
							placeholder="e.g. Alex"
							autocomplete="given-name"
							required
							bind:value={firstName}
							class="h-11"
						/>
					</div>
					<div class="flex flex-col gap-2">
						<Label for="last-name">{m['CheckoutPage.lastName']()}</Label><Input
							id="last-name"
							name="lastName"
							placeholder="e.g. Morgan"
							autocomplete="family-name"
							required
							bind:value={lastName}
							class="h-11"
						/>
					</div>
					<div class="flex flex-col gap-2">
						<Label for="email">{m['CheckoutPage.email']()}</Label><Input
							id="email"
							name="email"
							placeholder="you@example.com"
							type="email"
							autocomplete="email"
							required
							bind:value={email}
							class="h-11"
						/>
					</div>
					<div class="flex flex-col gap-2">
						<Label for="phone">{m['CheckoutPage.phone']()}</Label><Input
							id="phone"
							name="phone"
							placeholder="e.g. +1 555 123 4567"
							type="tel"
							autocomplete="tel"
							required
							bind:value={phone}
							class="h-11"
						/>
					</div>
				</div>
			</fieldset>
			<fieldset class="min-w-0 border-t pt-8">
				<legend class="float-left mb-5 w-full text-xl font-semibold"
					>{m['CheckoutPage.fulfillment']()}</legend
				>
				<div class="clear-both grid gap-3 sm:grid-cols-2">
					<label
						class="flex cursor-pointer items-center gap-3 rounded-xl border p-4 has-checked:border-primary has-checked:bg-primary/5 has-focus-visible:ring-2 has-focus-visible:ring-ring"
					>
						<input
							type="radio"
							name="fulfillment"
							value="delivery"
							bind:group={fulfillment}
							class="size-4 accent-primary"
						/>
						<span class="flex flex-1 flex-col gap-1"
							><span class="font-medium">{m['CheckoutPage.delivery']()}</span><span
								class="text-xs text-muted-foreground">{m['CheckoutPage.deliveryHint']()}</span
							></span
						>
						<span class="icon-[lucide--truck] size-5 text-muted-foreground" aria-hidden="true"
						></span>
					</label>
					<label
						class="flex cursor-pointer items-center gap-3 rounded-xl border p-4 has-checked:border-primary has-checked:bg-primary/5 has-focus-visible:ring-2 has-focus-visible:ring-ring"
					>
						<input
							type="radio"
							name="fulfillment"
							value="pickup"
							bind:group={fulfillment}
							class="size-4 accent-primary"
						/>
						<span class="flex flex-1 flex-col gap-1"
							><span class="font-medium">{m['CheckoutPage.pickup']()}</span><span
								class="text-xs text-muted-foreground">{m['CheckoutPage.pickupHint']()}</span
							></span
						>
						<span class="icon-[lucide--store] size-5 text-muted-foreground" aria-hidden="true"
						></span>
					</label>
				</div>
			</fieldset>
			<fieldset
				hidden={fulfillment !== 'delivery'}
				disabled={fulfillment !== 'delivery'}
				class="min-w-0"
			>
				<legend class="mb-5 text-lg font-semibold">{m['CheckoutPage.address']()}</legend>
				<div class="grid gap-5 sm:grid-cols-2">
					<div class="flex flex-col gap-2 sm:col-span-2">
						<Label for="street">{m['CheckoutPage.street']()}</Label><Input
							id="street"
							name="street"
							placeholder="123 Main Street"
							autocomplete="shipping address-line1"
							required
							bind:value={street}
							class="h-11"
						/>
					</div>
					<div class="flex flex-col gap-2 sm:col-span-2">
						<Label for="apartment">{m['CheckoutPage.apartment']()}</Label><Input
							id="apartment"
							name="apartment"
							placeholder="Apartment or suite number"
							autocomplete="shipping address-line2"
							bind:value={apartment}
							class="h-11"
						/>
					</div>
					<div class="flex flex-col gap-2">
						<Label for="postal-code">{m['CheckoutPage.postalCode']()}</Label><Input
							id="postal-code"
							name="postalCode"
							placeholder="e.g. 10001"
							autocomplete="shipping postal-code"
							required
							bind:value={postalCode}
							class="h-11"
						/>
					</div>
					<div class="flex flex-col gap-2">
						<Label for="city">{m['CheckoutPage.city']()}</Label><Input
							id="city"
							name="city"
							placeholder="e.g. New York"
							autocomplete="shipping address-level2"
							required
							bind:value={city}
							class="h-11"
						/>
					</div>
					<div class="flex flex-col gap-2 sm:col-span-2">
						<Label for="country">{m['CheckoutPage.country']()}</Label><Input
							id="country"
							name="country"
							placeholder="e.g. United States"
							autocomplete="shipping country-name"
							required
							bind:value={country}
							class="h-11"
						/>
					</div>
				</div>
			</fieldset>
			{#if fulfillment === 'pickup'}
				<p class="rounded-lg bg-muted/50 p-4 text-sm leading-relaxed text-muted-foreground">
					{m['CheckoutPage.pickupInfo']()}
				</p>
			{/if}
			<div class="flex items-start gap-3 border-t pt-6">
				<span
					class="mt-0.5 icon-[lucide--credit-card] size-5 text-muted-foreground"
					aria-hidden="true"
				></span>
				<div class="flex flex-col gap-1">
					<h2 class="text-sm font-medium">{m['CheckoutPage.payment']()}</h2>
					<p class="text-sm text-muted-foreground">{m['CheckoutPage.paymentHint']()}</p>
				</div>
			</div>
		</form>
		<aside
			aria-labelledby="order-summary"
			class="rounded-2xl border bg-muted/20 p-5 sm:p-6 lg:sticky lg:top-24"
		>
			<h2 id="order-summary" class="mb-6 text-xl font-semibold">{m['CheckoutPage.summary']()}</h2>
			{#if createdOrderId}
				<div class="rounded-xl border bg-primary/5 p-5 text-center" role="status">
					<span class="icon-[lucide--circle-check] mx-auto mb-3 size-7 text-primary" aria-hidden="true"></span>
					<p class="font-semibold">{m['CheckoutPage.orderCreated']()}</p>
					<p class="mt-1 text-sm text-muted-foreground">
						{m['CheckoutPage.orderReference']({ id: createdOrderId })}
					</p>
				</div>
			{:else if cart.error || products.error}
				<ErrorComponent message={m['CartFeature.Cart.loadError']()} />
			{:else if cart.loaded && cart.items.length === 0}
				<EmptyData
					title={m['CartFeature.Cart.emptyTitle']()}
					description={m['CartFeature.Cart.emptyDescription']()}
				/>
			{:else if loading}
				<CheckoutSummaryLoading />
			{:else if products.data?.invalidIds.length}
				<p role="alert" class="mb-4 text-sm">{m['CheckoutPage.unavailable']()}</p>
				<Button
					variant="outline"
					class="h-auto min-h-11 whitespace-normal"
					onclick={() => cart.removeInvalidItems(products.data?.invalidIds ?? [])}
					>{m['CheckoutPage.removeUnavailable']()}</Button
				>
			{:else}
				<ul class="divide-y divide-border">
					{#each items as item (item.id)}<CheckoutSummaryItem {item} />{/each}
				</ul>
				<dl class="flex flex-col gap-3 border-t pt-5 text-sm">
					<div class="flex justify-between gap-4">
						<dt class="text-muted-foreground">{m['CheckoutPage.subtotal']()}</dt>
						<dd class="tabular-nums">{formatPrice(total)}</dd>
					</div>
					<div class="flex justify-between gap-4">
						<dt class="text-muted-foreground">
							{fulfillment === 'delivery'
								? m['CheckoutPage.delivery']()
								: m['CheckoutPage.pickup']()}
						</dt>
						<dd class="text-right">
							{fulfillment === 'delivery' ? m['CheckoutPage.deliveryPending']() : formatPrice(0)}
						</dd>
					</div>
					<div class="mt-2 flex items-baseline justify-between gap-4 border-t pt-5 font-semibold">
						<dt>
							{fulfillment === 'delivery'
								? m['CheckoutPage.estimatedTotal']()
								: m['CheckoutPage.total']()}
						</dt>
						<dd class="text-2xl tracking-tight tabular-nums">{formatPrice(total)}</dd>
					</div>
				</dl>
			{/if}
			<Button
				type="submit"
				form="checkout-form"
				disabled={loading || submitting || cart.items.length === 0 || createdOrderId !== null}
				class="mt-6 h-12 w-full"
				aria-describedby="payment-status"
			>
				<span class="icon-[lucide--lock-keyhole] size-4" aria-hidden="true"></span>
				{submitting ? m['CheckoutPage.creatingOrder']() : m['CheckoutPage.continue']()}
			</Button>
			<p id="payment-status" class="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
				{m['CheckoutPage.paymentUnavailable']()}
			</p>
		</aside>
	</div>
</Section>
