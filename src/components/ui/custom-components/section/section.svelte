<script lang="ts">
	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	// Section: a layout band that centres its content and owns the page's
	// vertical rhythm, so callers never repeat max-w / mx-auto / px / py.
	//
	// Two layers, each with its own class prop — this is what makes it
	// full-bleed friendly:
	//   - class          → the outer band (background, borders, vertical padding)
	//   - containerClass → the centred content box (grids, alignment, ...)
	// So `<Section class="bg-muted" size="lg">` tints the whole width of the
	// page, not just the centred column. Any other attributes (id, aria-*,
	// data-*) land on the outer element automatically.
	let {
		children,
		as = 'section',
		size = 'md',
		width = 'default',
		containerClass,
		class: className,
		...restProps
	}: HTMLAttributes<HTMLElement> & {
		children?: Snippet;
		/** Semantic element to render — keeps this useful where <section> isn't right. */
		as?: 'section' | 'div' | 'article' | 'header' | 'footer' | 'main' | 'aside' | 'nav';
		/** Vertical padding of the band. */
		size?: 'none' | 'sm' | 'md' | 'lg';
		/** Max width of the centred content. */
		width?: 'narrow' | 'default' | 'wide' | 'full';
		/** Classes for the centred content box (grids, alignment, ...). */
		containerClass?: string;
		class?: string;
	} = $props();

	const sizes = {
		none: '',
		sm: 'py-8',
		md: 'py-16',
		lg: 'py-24'
	};

	const widths = {
		narrow: 'max-w-4xl',
		default: 'max-w-6xl',
		wide: 'max-w-7xl',
		full: 'max-w-full'
	};
</script>

<svelte:element this={as} class={cn('w-full', sizes[size], className)} {...restProps}>
	<div class={cn('mx-auto w-full px-4 sm:px-6', widths[width], containerClass)}>
		{@render children?.()}
	</div>
</svelte:element>
