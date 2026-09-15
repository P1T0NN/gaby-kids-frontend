// CONFIG
import { ORDER_CONFIG } from '@/shared/features/orders/config.js';

// HOOKS
import { useLocalStorage } from '@/hooks/useLocalStorage.svelte.js';

// SCHEMAS
import { storedOrdersSchema } from '@/shared/features/orders/schemas/ordersSchemas.js';

// TYPES
import type { Id } from '@convex/_generated/dataModel.js';

type StoredOrder = { id: Id<'orders'>; receiptToken: string };

function parseOrdersLocal(raw: string | null): StoredOrder[] {
	if (!raw) return [];

	try {
		const result = storedOrdersSchema.safeParse(JSON.parse(raw));
		return result.success ? result.data : [];
	} catch {
		return [];
	}
}

export function useOrdersLocal(enabled: () => boolean = () => true) {
	const localStorage = useLocalStorage<StoredOrder[]>(
		ORDER_CONFIG.localStorageKey,
		[],
		parseOrdersLocal,
		enabled
	);

	function addOrderLocal(id: Id<'orders'>, receiptToken: string): boolean {
		if (!localStorage.read() || localStorage.value.some((order) => order.id === id)) return false;
		return localStorage.set(
			[...localStorage.value, { id, receiptToken }].slice(-ORDER_CONFIG.maxStoredOrders)
		);
	}

	function removeOrdersLocal(ids: string[]): boolean {
		if (ids.length === 0 || !localStorage.read()) return false;
		const nextItems = localStorage.value.filter((order) => !ids.includes(order.id));
		if (nextItems.length === localStorage.value.length) return false;
		return localStorage.set(nextItems);
	}

	return {
		get ordersLocal() {
			return localStorage.value;
		},
		get loadedLocal() {
			return localStorage.loaded;
		},
		get errorLocal() {
			return localStorage.error;
		},
		addOrderLocal,
		removeOrdersLocal
	};
}
