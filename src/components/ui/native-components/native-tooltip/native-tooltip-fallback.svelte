<script lang="ts">
	// COMPONENTS
	import * as Tooltip from '@/components/ui/tooltip/index.js';

	// TYPES
	import type { Snippet } from 'svelte';

	type TooltipSide = 'top' | 'bottom' | 'left' | 'right';

	let {
		id,
		trigger,
		children,
		class: className,
		side,
		sideOffset,
		triggerLabel
	}: {
		id: string;
		trigger: Snippet;
		children: Snippet;
		class?: string;
		side: TooltipSide;
		sideOffset: number;
		triggerLabel?: string;
	} = $props();
</script>

<Tooltip.Root>
	<Tooltip.Trigger
		aria-describedby={id}
		aria-label={triggerLabel}
		class="inline-flex cursor-help items-center justify-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
	>
		{@render trigger()}
	</Tooltip.Trigger>

	<Tooltip.Content {id} {side} {sideOffset} class={className}>
		{@render children()}
	</Tooltip.Content>
</Tooltip.Root>
