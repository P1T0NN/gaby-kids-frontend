/**
 * `state` — the filter set lives in local `$state`; the URL is untouched. Use
 * for admin/authed pages where URL noise is unwanted.
 *
 * `url` — each active filter reads/writes a search param (`?status=…&price=…`).
 * SSR-readable, shareable, back/forward friendly. Use for public/SEO pages.
 */
export type FilterMode = 'state' | 'url';

export type FilterOption = {
	/** Stable option id — URL-safe; `''` is reserved for the "All" (inactive) option. */
	value: string;
	label: string;
};

export type FilterDef = {
	/** Stable id — the URL param name and the server predicate-registry key. */
	key: string;
	/** Human label for the summary pill / aria. */
	label: string;
	/** First entry MUST be `{ value: '', label: 'All' }` — the inactive sentinel. */
	options: FilterOption[];
	placeholder?: string;
	/** Sort control: it changes result order, not which rows match, so it never counts as a filter. */
	isSort?: boolean;
};

/** key → selected option value; entries with `''` are treated as inactive. */
export type ActiveFilters = Record<string, string>;

/** Inclusive-min / exclusive-max numeric range bucket. */
export type NumberBucket = { value: string; min?: number; max?: number };

export type FiltersOptions = {
	mode?: FilterMode;
	defs: FilterDef[];
	/** Debounce delay for `setDebounced`; defaults to one second. */
	debounceMs?: number;
};

export type FiltersApi = {
	defs: FilterDef[];
	/** Current visible value per key (`''` when inactive). */
	value(key: string): string;
	set(key: string, value: string): void;
	/** Update the visible value now and commit it after the debounce delay. */
	setDebounced(key: string, value: string): void;
	/** Only non-empty entries. */
	get active(): ActiveFilters;
	get count(): number;
	get isActive(): boolean;
	/** Active entries that actually filter; sort controls are excluded. */
	get filterCount(): number;
	get isFiltering(): boolean;
	/** Canonical, stable serialization (sorted keys) — the pagination reset + cache key. */
	get identity(): string;
	clear(key: string): void;
	clearAll(): void;
};
