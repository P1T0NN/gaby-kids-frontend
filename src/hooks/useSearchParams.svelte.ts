// SVELTEKIT IMPORTS
import { afterNavigate, pushState, replaceState } from '$app/navigation';
import { page } from '$app/state';

/**
 * Universal URL search-params plumbing. `keys` are the params this hook
 * *owns*: `write` updates only them and preserves every other param, the
 * pathname and the hash. Reading is unrestricted — `get`/`read` work for any
 * key. Callers keep their own `$state` (debounce, min-chars, mode) on top.
 *
 * `get(key)` — raw read (`string | null`, matches `URLSearchParams.get`).
 * `read(key)` — read with `''` fallback (the string url-mode state wants).
 * `write(values)` updates the owned params (replace history by default; pass
 * `{ history: 'push' }` when each change should create a history entry).
 * `onUrlChange(cb)` — run `cb` after any in-app navigation that reaches a new
 * URL (link clicks, `goto`, back/forward). Call it during component init.
 */
export function useSearchParams(
	keys: string[] | (() => string[]) = [],
	{ history = 'replace' }: { history?: 'replace' | 'push' } = {}
) {
	const getKeys = Array.isArray(keys) ? () => keys : keys;
	const get = (key: string): string | null => page.url.searchParams.get(key);

	const read = (key: string): string => get(key) ?? '';

	function buildUrl(values: Record<string, string>): string {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- Mutable URL is intentional while building the navigation target.
		const url = new URL(window.location.href);
		for (const key of getKeys()) {
			url.searchParams.delete(key);
			const value = values[key];
			if (value) url.searchParams.set(key, value);
		}
		return `${url.pathname}${url.search}${url.hash}`;
	}

	function write(values: Record<string, string>): void {
		const url = buildUrl(values);
		const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
		if (url !== currentUrl) {
			// eslint-disable-next-line svelte/no-navigation-without-resolve -- This shared helper intentionally performs shallow URL navigation.
			(history === 'push' ? pushState : replaceState)(url, {});
		}
	}

	function onUrlChange(callback: () => void): void {
		afterNavigate(() => callback());
	}

	return { get, read, write, onUrlChange };
}
