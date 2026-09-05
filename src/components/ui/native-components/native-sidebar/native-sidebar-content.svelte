<script lang="ts">
	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { Snippet } from 'svelte';

	let {
		children,
		class: className
	}: {
		children: Snippet;
		class?: string;
	} = $props();
</script>

<div class={cn('min-h-0 min-w-0 flex-1 p-4 sm:p-6', className)}>
	{@render children()}
</div>
