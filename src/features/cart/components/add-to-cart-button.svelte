<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Button, type ButtonProps } from '@/components/ui/button/index.js';

	// HOOKS
	import { useCart } from '@/features/cart/hooks/useCart.svelte.js';

	// UTILS
	import { toastMessage } from '@/utils/toastMessage.js';

	// TYPES
	import type { Snippet } from 'svelte';
	import type { CartItem } from '@/shared/features/cart/types/cartTypes.js';

	type Props = Omit<ButtonProps, 'children' | 'onclick' | 'href' | 'type'> & {
		item: Omit<CartItem, 'quantity'>;
		name: string;
		children?: Snippet;
	};

	let { item, name, children, disabled = false, ...restProps }: Props = $props();

	const cart = useCart();

	function addToCart(): void {
		if (cart.addItem(item)) {
			toastMessage({ type: 'success', message: m['CartFeature.Cart.addSuccess']({ name }) });
		} else if (cart.error) {
			toastMessage({
				type: 'error',
				error: cart.error,
				message: m['CartFeature.Cart.saveError']()
			});
		}
	}
</script>

<Button {...restProps} type="button" disabled={disabled || !cart.loaded} onclick={addToCart}>
	{#if children}
		{@render children()}
	{:else}
		<span class="icon-[lucide--shopping-cart] size-4" data-icon="inline-start" aria-hidden="true"
		></span>
		{m['CartFeature.Cart.addToCart']()}
	{/if}
</Button>
