// LIBRARIES
import { m } from '@/lib/paraglide/messages';

// CONFIG
import { CART_CONFIG } from '@/shared/features/cart/config.js';

// HOOKS
import { useLocalStorage } from '@/hooks/useLocalStorage.svelte.js';

// UTILS
import { addCartItem } from '@/features/cart/utils/addCartItem.js';
import { parseCartItems } from '@/features/cart/utils/parseCartItems.js';
import { toastMessage } from '@/utils/toastMessage.js';

// TYPES
import type { CartItem } from '@/shared/features/cart/types/cartTypes.js';

export function useCart() {
	const localStorage = useLocalStorage<CartItem[]>(CART_CONFIG.localStorageKey, [], parseCartItems);

	function getTotalQuantity(items: readonly CartItem[]): number {
		return items.reduce((total, item) => total + item.quantity, 0);
	}

	function addItem(item: Omit<CartItem, 'quantity'>, toasterId?: string): boolean {
		if (!item.productVariantId.trim()) return false;
		if (!localStorage.read()) return false;

		const nextItems = addCartItem(localStorage.value, item);
		if (getTotalQuantity(nextItems) > CART_CONFIG.maxItems) {
			toastMessage({
				type: 'error',
				error: new Error(),
				message: m['CartFeature.Cart.maxItemsReached']({ maxItems: CART_CONFIG.maxItems }),
				toasterId
			});
			return false;
		}

		return localStorage.set(nextItems);
	}

	function setItemQuantity(productVariantId: string, quantity: number): boolean {
		if (!Number.isSafeInteger(quantity) || quantity < 1) return false;

		const itemIndex = localStorage.value.findIndex(
			(item) => item.productVariantId === productVariantId
		);
		if (itemIndex === -1) return false;

		const nextItems = localStorage.value.map((item, index) =>
			index === itemIndex ? { ...item, quantity } : item
		);

		if (getTotalQuantity(nextItems) > CART_CONFIG.maxItems) return false;
		return localStorage.set(nextItems);
	}

	function removeItem(productVariantId: string): boolean {
		const nextItems = localStorage.value.filter(
			(item) => item.productVariantId !== productVariantId
		);
		return nextItems.length !== localStorage.value.length && localStorage.set(nextItems);
	}

	function removeInvalidItems(productVariantIds: string[]): boolean {
		if (!localStorage.read()) return false;
		const nextItems = localStorage.value.filter(
			(item) => !productVariantIds.includes(item.productVariantId)
		);
		return nextItems.length !== localStorage.value.length && localStorage.set(nextItems);
	}

	function replaceItems(items: readonly CartItem[]): boolean {
		if (getTotalQuantity(items) > CART_CONFIG.maxItems) return false;
		return localStorage.set(items.map((item) => ({ ...item })));
	}

	return {
		get items() {
			return localStorage.value;
		},
		get loaded() {
			return localStorage.loaded;
		},
		get error() {
			return localStorage.error;
		},
		get totalItems() {
			return getTotalQuantity(localStorage.value);
		},
		addItem,
		setItemQuantity,
		removeItem,
		removeInvalidItems,
		replaceItems
	};
}
