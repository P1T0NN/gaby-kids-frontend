export type EmptyDataAction =
	| { label: string; href: string; onclick?: never }
	| { label: string; href?: never; onclick: () => void };
