<script lang="ts">
	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { Snippet } from 'svelte';

	// Native Popover API: the browser handles open/close, light-dismiss on
	// outside click, and Esc. Positioning uses CSS anchor positioning, so no
	// JS lib needed. The trigger button sets `popovertarget`; the panel is the
	// `[popover]` element anchored below it.
	let {
		id,
		trigger,
		children,
		class: className,
		align = 'end',
		side = 'bottom',
		triggerClass,
		triggerLabel,
		closeOnClick = false
	}: {
		id: string;
		trigger: Snippet;
		children: Snippet;
		class?: string;
		align?: 'start' | 'end';
		side?: 'top' | 'bottom';
		triggerClass?: string;
		triggerLabel?: string;
		closeOnClick?: boolean;
	} = $props();

	function closeOnSelection(element: HTMLDivElement): void | (() => void) {
		if (!closeOnClick) return;

		function handleClick(event: MouseEvent): void {
			if (!(event.target instanceof HTMLElement)) return;
			if (event.target.closest('a, button')) element.hidePopover();
		}

		element.addEventListener('click', handleClick);
		return () => element.removeEventListener('click', handleClick);
	}
</script>

<button
	type="button"
	popovertarget={id}
	aria-haspopup="menu"
	aria-label={triggerLabel}
	style={`anchor-name: --np-${id}`}
	class={cn(
		'inline-flex cursor-pointer appearance-none items-center rounded-full p-0 transition-transform outline-none focus-visible:ring-3 focus-visible:ring-ring/40 active:scale-95',
		triggerClass
	)}
>
	{@render trigger?.()}
</button>

<div
	{id}
	popover="auto"
	{@attach closeOnSelection}
	style={`position-anchor: --np-${id}; position-area: ${side} ${align === 'end' ? 'span-left' : 'right'}; justify-self: ${align === 'end' ? 'end' : 'start'}`}
	class={cn(
		'inset-auto m-0 min-w-52 rounded-2xl border bg-popover p-1 text-popover-foreground shadow-lg',
		side === 'top' ? 'mb-2' : 'mt-2',
		className
	)}
>
	{@render children?.()}
</div>
