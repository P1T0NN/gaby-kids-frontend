// SVELTEKIT IMPORTS
import { onMount } from 'svelte';

// HOOKS
import { useDebounce } from '@/hooks/useDebounce.svelte.js';
import { useSearchParams } from '@/hooks/useSearchParams.svelte';

// TYPES
import type {
	ActiveFilters,
	FiltersApi,
	FiltersOptions
} from '@/shared/features/filters/types/filterTypes.js';

/**
 * Shared filter state behind any list/table filter bar. Owns the selected
 * value per `def.key` (defaulting to `''` = the "All" sentinel) and, in `url`
 * mode, one search param per active filter. State is returned as getters —
 * destructuring would snapshot it.
 *
 * `value(key)` is the current visible value; `active`/`count`/`isActive`/
 * `identity` derive from the committed values. Bake `identity` into the query
 * and pass it as the component's `filters` prop so pagination reset and refetch
 * stay in lockstep.
 *
 * Deliberately `$effect`-free: immediate changes write at once, debounced
 * changes are scheduled by `setDebounced`, and external URL changes
 * (back/forward) are picked up via `useSearchParams.onPopState`. `onMount`
 * owns cleanup, so this must be called during component init (a `<script>`
 * block), never in `<script module>` or at module scope.
 */
export function useFilters(options: FiltersOptions): FiltersApi {
	const { mode = 'state', defs, debounceMs = 1000 } = options;

	const keys = defs.map((d) => d.key);
	const { read, write, onPopState } = useSearchParams(keys);

	// Seed from the URL in `url` mode; all-inactive in `state` mode.
	const initial = () => {
		const state: Record<string, string> = {};
		for (const def of defs) {
			state[def.key] = mode === 'url' ? read(def.key) : '';
		}
		return state;
	};

	const initialValues = initial();
	let values = $state(initialValues);
	let pendingValues = $state({ ...initialValues });
	const debounce = useDebounce(debounceMs);

	function clearDebounce(): void {
		debounce.cancel();
	}

	function writeUrl(nextValues: Record<string, string>): void {
		if (mode === 'url') write(nextValues);
	}

	function apply(nextValues: Record<string, string>): void {
		values = nextValues;
		pendingValues = { ...nextValues };
		writeUrl(nextValues);
	}

	// External URL changes (back/forward, manual edit) sync straight into state.
	onMount(() => {
		let unsubscribe: (() => void) | undefined;
		if (mode === 'url') {
			unsubscribe = onPopState(() => {
				clearDebounce();
				const next = { ...values };
				let changed = false;
				for (const def of defs) {
					const fromUrl = read(def.key);
					if (fromUrl !== next[def.key]) {
						next[def.key] = fromUrl;
						changed = true;
					}
				}
				if (changed) {
					values = next;
					pendingValues = { ...next };
				}
			});
		}
		return () => {
			unsubscribe?.();
			clearDebounce();
		};
	});

	const active = $derived.by(() => {
		const result: ActiveFilters = {};
		for (const [key, value] of Object.entries(values)) {
			if (value) result[key] = value;
		}
		return result;
	});

	const count = $derived(Object.keys(active).length);
	const isActive = $derived(count > 0);
	// Canonical, order-independent serialization — sorted keys so `{status,price}`
	// and `{price,status}` produce the same reset/cache key.
	const identity = $derived(
		Object.entries(active)
			.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
			.map(([key, value]) => `${key}=${value}`)
			.join('\u0000')
	);

	return {
		defs,
		value(key: string) {
			return pendingValues[key] ?? '';
		},
		set(key: string, value: string) {
			clearDebounce();
			apply({ ...values, [key]: value });
		},
		setDebounced(key: string, value: string) {
			pendingValues = { ...pendingValues, [key]: value };
			clearDebounce();
			debounce.schedule(() => {
				apply({ ...pendingValues });
			});
		},
		get active() {
			return active;
		},
		get count() {
			return count;
		},
		get isActive() {
			return isActive;
		},
		get identity() {
			return identity;
		},
		clear(key: string) {
			clearDebounce();
			apply({ ...values, [key]: '' });
		},
		clearAll() {
			clearDebounce();
			const cleared: Record<string, string> = {};
			for (const def of defs) cleared[def.key] = '';
			apply(cleared);
		}
	};
}
