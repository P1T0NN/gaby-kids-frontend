// SVELTEKIT IMPORTS
import { page } from '$app/state';

function normalizePath(path: string): string {
	const pathname = path.split(/[?#]/, 1)[0] || '/';
	return pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
}

/** Match a sidebar item to a pathname, including nested routes by default. */
export function isActivePath(itemPath: string, currentPath: string, exact = false): boolean {
	const item = normalizePath(itemPath);
	const current = normalizePath(currentPath);

	return exact ? current === item : current === item || current.startsWith(`${item}/`);
}

/** Reactive pathname state and route matching for Svelte components. */
export function usePathname() {
	const pathname = $derived(page.url.pathname);

	return {
		get pathname() {
			return pathname;
		},
		isActive(itemPath: string, exact = false) {
			return isActivePath(itemPath, pathname, exact);
		}
	};
}
