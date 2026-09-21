<script lang="ts">
	// SVELTEKIT IMPORTS
	import { cubicOut } from 'svelte/easing';
	import { prefersReducedMotion, Tween } from 'svelte/motion';

	// LIBRARIES
	import { getLocale } from '@/lib/paraglide/runtime';

	let {
		value,
		format = (value: number) => Math.round(value).toLocaleString(getLocale()),
		duration = 600,
		class: className
	}: {
		value: number;
		format?: (value: number) => string;
		duration?: number;
		class?: string;
	} = $props();

	const shown = new Tween(0, {
		duration: () => (prefersReducedMotion.current ? 0 : duration),
		easing: cubicOut
	});

	$effect(() => {
		shown.set(value);
	});
</script>

<span class={className}>{format(shown.current)}</span>
