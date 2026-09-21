// SVELTE IMPORTS
import { getContext, setContext } from 'svelte';

// CONFIG
import { CONTEXT_KEY } from '../config.js';

/**
 * Shares the analytics dashboard state through context. Call it once in the
 * page that owns the dashboard; descendants read it with
 * `useAnalyticsDashboardContext()`.
 */
export function createAnalyticsDashboardContext<T>(state: T): T {
	return setContext(Symbol.for(CONTEXT_KEY), state);
}

/** Reads the analytics dashboard state shared by `createAnalyticsDashboardContext()`. */
export function useAnalyticsDashboardContext<T>(): T {
	const dashboard = getContext<T | undefined>(Symbol.for(CONTEXT_KEY));
	if (!dashboard) {
		throw new Error(
			'useAnalyticsDashboardContext must be used under createAnalyticsDashboardContext'
		);
	}
	return dashboard;
}
