import type { Snippet } from 'svelte';

export type EmptyDataAction =
	| { label: string; href: string; icon?: Snippet; onclick?: never }
	| { label: string; href?: never; icon?: Snippet; onclick: () => void };
