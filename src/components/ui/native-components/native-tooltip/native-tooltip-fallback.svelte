<script lang="ts">
	// COMPONENTS
	import * as Tooltip from '@/components/ui/tooltip/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type TooltipSide = 'top' | 'bottom' | 'left' | 'right';

	let {
		id,
		trigger,
		children,
		class: className,
		side,
		sideOffset,
		triggerLabel,
		triggerClass,
		...restProps
	}: HTMLButtonAttributes & {
		id: string;
		trigger: Snippet;
		children: Snippet;
		class?: string;
		side: TooltipSide;
		sideOffset: number;
		triggerLabel?: string;
		/** Extra classes for the trigger button. */
		triggerClass?: string;
	} = $props();
</script>

<Tooltip.Root>
	<Tooltip.Trigger
		{...restProps}
		aria-describedby={id}
		aria-label={triggerLabel}
		class={cn(
			'inline-flex cursor-help items-center justify-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
			triggerClass
		)}
	>
		{@render trigger()}
	</Tooltip.Trigger>

	<Tooltip.Content {id} {side} {sideOffset} class={className}>
		{@render children()}
	</Tooltip.Content>
</Tooltip.Root>
