<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import Counter from '@/components/ui/custom-components/counter/counter.svelte';
	import ProductPrice from '@/features/products/components/product-price.svelte';

	// HOOKS
	import { useCart } from '@/features/cart/hooks/useCart.svelte.js';

	// UTILS
	import { toastMessage } from '@/utils/toastMessage.js';
	import { formatPrice } from '@/shared/utils/pricing.js';

	// TYPES
	import type { CartItem, CartProduct } from '@/shared/features/cart/types/cartTypes.js';

	type DisplayCartItem = CartItem & CartProduct;

	let { cartItems }: { cartItems: DisplayCartItem[] } = $props();

	const cart = useCart();

	const removeItem = (item: DisplayCartItem) => {
		if (item.quantity !== 1 || !cart.removeItem(item.id)) return;
		toastMessage({
			type: 'success',
			message: m['CartFeature.Cart.removeSuccess']({ name: item.name }),
			toasterId: 'cart'
		});
	};
</script>

<ul class="divide-y divide-border">
	{#each cartItems as item (item.id)}
		<li
			class="grid grid-cols-[5rem_minmax(0,1fr)] gap-x-4 gap-y-4 py-6 first:pt-0 sm:grid-cols-[6rem_minmax(0,1fr)]"
		>
			<div class="aspect-square overflow-hidden rounded-xl bg-muted">
				{#if item.image}
					<img src={item.image} alt="" class="size-full object-cover" />
				{:else}
					<div class="flex size-full items-center justify-center text-muted-foreground">
						<span class="icon-[lucide--package] size-7" aria-hidden="true"></span>
					</div>
				{/if}
			</div>

			<div class="flex min-w-0 flex-col items-start gap-1">
				<p class="text-sm leading-relaxed font-medium wrap-break-word">{item.name}</p>
				<div class="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
					<ProductPrice
						priceInCents={item.priceInCents}
						compareAtPriceInCents={item.compareAtPriceInCents}
						class="inline-flex"
						priceClass="text-xs font-normal"
						compareAtPriceClass="text-xs"
						discountClass="text-[10px]"
					/>
					<span>{m['CartFeature.Cart.each']()}</span>
				</div>
				<p class="mt-auto pt-2 text-lg font-semibold tracking-tight tabular-nums">
					{formatPrice(item.priceInCents * item.quantity)}
				</p>
			</div>
			<div class="col-span-2 flex flex-wrap items-center justify-between gap-3">
				<div class="rounded-full border border-border bg-background px-2 py-1.5">
					<Counter
						value={item.quantity}
						decreaseLabel={m['CartFeature.Cart.decreaseQuantity']()}
						increaseLabel={m['CartFeature.Cart.increaseQuantity']()}
						onValueChange={(quantity) => cart.setItemQuantity(item.id, quantity)}
					/>
				</div>
				<Button
					variant="ghost"
					size="sm"
					class="h-10 gap-2 px-3 text-muted-foreground hover:text-destructive"
					disabled={item.quantity !== 1}
					onclick={() => removeItem(item)}
				>
					<span class="icon-[lucide--trash-2] size-4" aria-hidden="true"></span>
					{m['CartFeature.Cart.remove']()}
				</Button>
			</div>
		</li>
	{/each}
</ul>
