<script lang="ts">
	// LIBRARIES
	import { onMount } from 'svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';
	import { m } from '@/lib/paraglide/messages';

	// TYPES
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type TooltipSide = 'top' | 'bottom' | 'left' | 'right';
	type NativeTooltipFallbackComponent = typeof import('./native-tooltip-fallback.svelte').default;

	let {
		id,
		trigger,
		children,
		class: className,
		side = 'top',
		sideOffset = 8,
		triggerLabel,
		triggerClass,
		...restProps
	}: HTMLButtonAttributes & {
		id: string;
		trigger: Snippet;
		children: Snippet;
		class?: string;
		side?: TooltipSide;
		sideOffset?: number;
		triggerLabel?: string;
		/** Extra classes for the trigger button. */
		triggerClass?: string;
	} = $props();

	let nativeSupported = $state<boolean | null>(null);
	let fallbackComponent = $state<NativeTooltipFallbackComponent | null>(null);
	let fallbackError = $state(false);

	function supportsNativeTooltip(): boolean {
		if (!('HTMLButtonElement' in window) || !('HTMLElement' in window) || !('CSS' in window))
			return false;

		const buttonPrototype = window.HTMLButtonElement.prototype;
		const elementPrototype = window.HTMLElement.prototype;
		const css = window.CSS;

		if (
			!('interestForElement' in buttonPrototype) ||
			!('showPopover' in elementPrototype) ||
			!('hidePopover' in elementPrototype) ||
			!('supports' in css) ||
			!css.supports('selector(:popover-open)') ||
			!css.supports('position-area', 'top')
		)
			return false;

		const probe = document.createElement('div');
		probe.id = `native-tooltip-probe-${Date.now()}-${Math.random()}`;
		probe.setAttribute('popover', 'hint');
		document.body.append(probe);

		try {
			if (probe.popover !== 'hint') return false;

			probe.showPopover();
			const opened = probe.matches(':popover-open');
			probe.hidePopover();

			return opened && !probe.matches(':popover-open');
		} catch {
			return false;
		} finally {
			probe.remove();
		}
	}

	async function loadFallback(): Promise<void> {
		try {
			const fallbackModule = await import('./native-tooltip-fallback.svelte');
			fallbackComponent = fallbackModule.default;
		} catch {
			fallbackError = true;
		}

		nativeSupported = false;
	}

	onMount(() => {
		if (supportsNativeTooltip()) {
			nativeSupported = true;
			return;
		}

		void loadFallback();
	});
</script>

{#if nativeSupported !== false}
	<button
		{...restProps}
		type="button"
		interestfor={id}
		aria-describedby={id}
		aria-label={triggerLabel}
		class={cn(
			'inline-flex cursor-help items-center justify-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
			triggerClass
		)}
	>
		{@render trigger()}
	</button>

	<div
		{id}
		popover="hint"
		role="tooltip"
		style={`inset: auto; position-area: ${side}; margin: ${sideOffset}px`}
		class={cn(
			'z-50 w-fit max-w-xs rounded-xl bg-foreground px-3 py-1.5 text-xs text-background shadow-md',
			className
		)}
	>
		{@render children()}
	</div>
{:else if fallbackComponent}
	{@const NativeTooltipFallback = fallbackComponent}

	<NativeTooltipFallback
		{id}
		{trigger}
		{side}
		{sideOffset}
		{triggerLabel}
		{triggerClass}
		class={className}
		{...restProps}
	>
		{@render children()}
	</NativeTooltipFallback>
{:else if fallbackError}
	<p role="alert" class="p-4 text-sm text-destructive">
		{m['Components.NativeTooltip.fallbackError']()}
	</p>
{/if}
