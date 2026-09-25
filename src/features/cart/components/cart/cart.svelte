<script lang="ts">
	// LIBRARIES
	import { onMount } from 'svelte';
	import { on } from 'svelte/events';
	import { m } from '@/lib/paraglide/messages';
	import { useConvexClient } from 'convex-svelte';
	import { api } from '@convex/_generated/api';
	import { toast } from 'svelte-sonner';
	import { Toaster } from '@/components/ui/sonner/index.js';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// COMPONENTS
	import ButtonLink from '@/components/ui/custom-components/button-link/button-link.svelte';
	import EmptyData from '@/components/ui/custom-components/empty-data/empty-data.svelte';
	import NativeSheet from '@/components/ui/native-components/native-sheet/native-sheet.svelte';
	import FreeShippingNudge from '@/features/orders/components/free-shipping-nudge.svelte';
	import CartItems from './cart-items.svelte';
	import CartLoading from './cart-loading.svelte';

	// HOOKS
	import { useCart } from '@/features/cart/hooks/useCart.svelte.js';

	// UTILS
	import {
		calculateOrderSavingsInCents,
		calculateOrderTotalInCents,
		formatPrice
	} from '@/shared/utils/pricing.js';

	// TYPES
	import type { CartProductVariant } from '@/shared/features/cart/types/cartTypes.js';

	const cart = useCart();

	const client = useConvexClient();

	let cartProductVariantsPromise = $state<Promise<CartProductVariant[]>>();
	let cartProductVariants = $state<CartProductVariant[]>([]);

	async function fetchCart(): Promise<CartProductVariant[]> {
		const result = await client.query(api.tables.productVariants.queries.fetchCart.fetchCart, {
			productVariantIds: cart.items.map((item) => item.productVariantId)
		});

		if (result.invalidIds.length && cart.removeInvalidItems(result.invalidIds)) {
			toast(m['CartFeature.Cart.unavailableItemsRemoved'](), { toasterId: 'cart' });
		}

		cartProductVariants = result.items;
		return result.items;
	}
	const badgeLabel = $derived(cart.totalItems > 9 ? '9+' : String(cart.totalItems));
	const pricingItems = $derived(
		cart.items.map((item) => {
			const productVariant = cartProductVariants.find(
				(cartProductVariant) => cartProductVariant.id === item.productVariantId
			);
			return {
				unitPriceInCents: productVariant?.priceInCents ?? 0,
				compareAtPriceInCents: productVariant?.compareAtPriceInCents,
				quantity: item.quantity
			};
		})
	);
	const totalPriceInCents = $derived(calculateOrderTotalInCents(pricingItems));
	const totalSavingsInCents = $derived(calculateOrderSavingsInCents(pricingItems));

	onMount(() =>
		on(window, 'cart:open', () => document.getElementById('cart-sheet-trigger')?.click())
	);
</script>

{#snippet trigger()}
	<span class="relative inline-flex">
		<span class="icon-[lucide--shopping-cart] size-5" aria-hidden="true"></span>
		{#if cart.totalItems > 0}
			<span
				class="absolute -top-2 -right-2 inline-flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-4 text-primary-foreground"
				aria-hidden="true"
			>
				{badgeLabel}
			</span>
		{/if}
	</span>
{/snippet}

{#snippet footer()}
	{#if cart.items.length > 0}
		<footer class="flex shrink-0 flex-col gap-4 border-t pt-4">
			<FreeShippingNudge subtotalInCents={totalPriceInCents} />
			{#if totalSavingsInCents > 0}
				<div class="flex items-center justify-between text-sm text-success">
					<span>{m['CartFeature.Cart.youSave']()}</span>
					<span class="font-medium tabular-nums">{formatPrice(totalSavingsInCents)}</span>
				</div>
			{/if}
			<div class="flex items-center justify-between text-lg font-semibold">
				<span>{m['CartFeature.Cart.total']()}</span>
				<span class="tabular-nums">{formatPrice(totalPriceInCents)}</span>
			</div>
			<ButtonLink
				href={UNPROTECTED_PAGE_ENDPOINTS.CHECKOUT}
				onclick={() => document.querySelector<HTMLDialogElement>('#cart-sheet')?.close()}
				class="w-full"
			>
				{m['CartFeature.Cart.goToCheckout']()}
			</ButtonLink>
		</footer>
	{/if}
{/snippet}

<NativeSheet
	id="cart-sheet"
	label={m['CartFeature.Cart.title']()}
	triggerLabel={m['CartFeature.Cart.openCart']()}
	class="pt-6"
	onOpen={() => {
		if (cart.loaded && !cart.error && cart.items.length) {
			cartProductVariants = [];
			cartProductVariantsPromise = fetchCart();
		}
	}}
	{trigger}
	{footer}
>
	<Toaster id="cart" position="bottom-right" />
	<div class="flex flex-col gap-6">
		<h2 class="border-b pr-10 pb-4 text-lg font-semibold">{m['CartFeature.Cart.title']()}</h2>

		{#if !cart.loaded}
			<CartLoading />
		{:else if cart.error}
			<p role="alert" class="text-sm text-destructive">{m['CartFeature.Cart.loadError']()}</p>
		{:else if cart.items.length === 0}
			<EmptyData
				title={m['CartFeature.Cart.emptyTitle']()}
				description={m['CartFeature.Cart.emptyDescription']()}
			/>
		{:else}
			{#await cartProductVariantsPromise}
				<CartLoading />
			{:then data}
				{@const cartItems = cart.items.flatMap((item) => {
					const productVariant = data?.find(
						(cartProductVariant) => cartProductVariant.id === item.productVariantId
					);
					return productVariant ? [{ ...item, ...productVariant }] : [];
				})}
				<CartItems {cartItems} />
			{:catch}
				<p role="alert" class="text-sm text-destructive">{m['CartFeature.Cart.loadError']()}</p>
			{/await}
		{/if}
	</div>
</NativeSheet>
