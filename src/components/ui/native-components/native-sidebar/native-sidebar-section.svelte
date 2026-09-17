<script lang="ts">
	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { Snippet } from 'svelte';

	let {
		title,
		children,
		class: className
	}: {
		title: string;
		children: Snippet;
		class?: string;
	} = $props();
</script>

<section class={cn('flex min-w-0 flex-col gap-1 not-last:pb-3', className)}>
	<h2 data-native-sidebar-section-title class="px-3 text-sm font-medium text-sidebar-foreground/70">
		{title}
	</h2>
	<div class="flex min-w-0 flex-col gap-1">
		{@render children()}
	</div>
</section>
