<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Button, type ButtonProps } from '@/components/ui/button/index.js';

	// HOOKS
	import { useCart } from '@/features/cart/hooks/useCart.svelte.js';
	import { getOpenUpsells } from '@/features/upsells/components/upsells-dialog/upsells-dialog-context.js';

	// UTILS
	import { toastMessage } from '@/utils/toastMessage.js';

	// TYPES
	import type { Snippet } from 'svelte';
	import type { CartItem } from '@/shared/features/cart/types/cartTypes.js';
	import type { Id } from '@convex/_generated/dataModel.js';

	type Props = Omit<ButtonProps, 'children' | 'onclick' | 'href' | 'type'> & {
		item: Omit<CartItem, 'quantity'> & { id: Id<'products'> };
		name: string;
		children?: Snippet;
		openCartAfterAdd?: boolean;
		showUpsellsAfterAdd?: boolean;
		toasterId?: string;
		onAdded?: () => void;
	};

	let {
		item,
		name,
		children,
		openCartAfterAdd = false,
		showUpsellsAfterAdd = false,
		toasterId,
		onAdded,
		disabled = false,
		...restProps
	}: Props = $props();

	const cart = useCart();
	const openUpsells = getOpenUpsells();

	function addToCart(): void {
		if (cart.addItem(item, toasterId)) {
			toastMessage({
				type: 'success',
				message: m['CartFeature.Cart.addSuccess']({ name }),
				toasterId
			});
			onAdded?.();
			if (showUpsellsAfterAdd) {
				openUpsells({ _id: item.id, name }, openCartAfterAdd);
			} else if (openCartAfterAdd) {
				window.dispatchEvent(new Event('cart:open'));
			}
		} else if (cart.error) {
			toastMessage({
				type: 'error',
				error: cart.error,
				message: m['CartFeature.Cart.saveError'](),
				toasterId
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
