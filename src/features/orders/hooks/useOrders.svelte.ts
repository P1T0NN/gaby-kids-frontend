// CONFIG
import { ORDER_CONFIG } from '@/shared/features/orders/config.js';

// HOOKS
import { useLocalStorage } from '@/hooks/useLocalStorage.svelte.js';

// SCHEMAS
import { storedOrdersSchema } from '@/shared/features/orders/schemas/ordersSchemas.js';

// TYPES
import type { Id } from '@convex/_generated/dataModel.js';

export type StoredOrder = { id: Id<'orders'>; retryKey: string };

function parseOrders(raw: string | null): StoredOrder[] {
	if (!raw) return [];

	try {
		const result = storedOrdersSchema.safeParse(JSON.parse(raw));
		return result.success ? result.data : [];
	} catch {
		return [];
	}
}

export function useOrders(enabled: () => boolean = () => true) {
	const localStorage = useLocalStorage<StoredOrder[]>(
		ORDER_CONFIG.localStorageKey,
		[],
		parseOrders,
		enabled
	);

	function addOrder(id: Id<'orders'>, retryKey: string): boolean {
		if (!localStorage.read() || localStorage.value.some((order) => order.id === id)) return false;
		return localStorage.set(
			[...localStorage.value, { id, retryKey }].slice(-ORDER_CONFIG.maxStoredOrders)
		);
	}

	function removeOrders(ids: string[]): boolean {
		if (ids.length === 0 || !localStorage.read()) return false;
		const nextItems = localStorage.value.filter((order) => !ids.includes(order.id));
		if (nextItems.length === localStorage.value.length) return false;
		return localStorage.set(nextItems);
	}

	return {
		get orders() {
			return localStorage.value;
		},
		get loaded() {
			return localStorage.loaded;
		},
		get error() {
			return localStorage.error;
		},
		addOrder,
		removeOrders
	};
}
