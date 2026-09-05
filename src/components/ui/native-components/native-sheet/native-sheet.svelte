<script lang="ts">
	// LIBRARIES
	import { onMount } from 'svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';
	import { m } from '@/lib/paraglide/messages';

	// TYPES
	import type { Snippet } from 'svelte';

	type NativeSheetFallbackComponent = typeof import('./native-sheet-fallback.svelte').default;

	let {
		id,
		trigger,
		children,
		footer,
		class: className,
		label,
		triggerLabel,
		onOpen,
		closeLabel = m['Components.NativeSheet.close']()
	}: {
		id: string;
		trigger?: Snippet;
		children: Snippet;
		footer?: Snippet;
		class?: string;
		label: string;
		triggerLabel?: string;
		onOpen?: () => void;
		closeLabel?: string;
	} = $props();

	let nativeSupported = $state<boolean | null>(null);
	let fallbackComponent = $state<NativeSheetFallbackComponent | null>(null);
	let fallbackError = $state(false);

	function supportsNativeSheet(): boolean {
		if (
			!('HTMLDialogElement' in window) ||
			!('HTMLButtonElement' in window) ||
			!('CSS' in window) ||
			!('CSSStartingStyleRule' in window)
		)
			return false;

		const dialogPrototype = window.HTMLDialogElement.prototype;
		const buttonPrototype = window.HTMLButtonElement.prototype;
		const css = window.CSS;

		if (
			!('showModal' in dialogPrototype) ||
			!('closedBy' in dialogPrototype) ||
			!('command' in buttonPrototype) ||
			!('commandForElement' in buttonPrototype) ||
			!('supports' in css) ||
			!css.supports('transition', 'display 1ms allow-discrete') ||
			!css.supports('transition', 'overlay 1ms allow-discrete')
		)
			return false;

		const probeId = `native-sheet-probe-${Date.now()}-${Math.random()}`;
		const dialog = document.createElement('dialog');
		const opener = document.createElement('button');
		const closer = document.createElement('button');

		dialog.id = probeId;
		dialog.setAttribute('closedby', 'any');
		opener.setAttribute('commandfor', probeId);
		opener.setAttribute('command', 'show-modal');
		closer.setAttribute('commandfor', probeId);
		closer.setAttribute('command', 'close');
		document.body.append(opener, dialog, closer);

		try {
			opener.click();
			const opened = dialog.open;
			closer.click();
			return opened && !dialog.open;
		} catch {
			return false;
		} finally {
			if (dialog.open) dialog.close();
			opener.remove();
			dialog.remove();
			closer.remove();
		}
	}

	async function loadFallback(): Promise<void> {
		try {
			const fallbackModule = await import('./native-sheet-fallback.svelte');
			fallbackComponent = fallbackModule.default;
		} catch {
			fallbackError = true;
		}

		nativeSupported = false;
	}

	onMount(() => {
		if (supportsNativeSheet()) {
			nativeSupported = true;
			return;
		}

		void loadFallback();
	});
</script>

{#if nativeSupported !== false}
	{#if trigger}
		<button
			type="button"
			commandfor={id}
			command="show-modal"
			onclick={onOpen}
			aria-controls={id}
			aria-haspopup="dialog"
			aria-label={triggerLabel}
			class="inline-flex cursor-pointer items-center justify-center rounded-md p-2 transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40"
		>
			{@render trigger()}
		</button>
	{/if}

	<dialog
		{id}
		closedby="any"
		aria-label={label}
		class={cn(
			'wrap:anywhere box-border h-dvh max-h-none w-full max-w-md overflow-x-auto overflow-y-auto border bg-sidebar p-6 pt-14 text-sidebar-foreground shadow-2xl',
			className
		)}
	>
		<button
			type="button"
			commandfor={id}
			command="close"
			aria-label={closeLabel}
			class="absolute top-4 right-4 inline-flex size-8 cursor-pointer items-center justify-center rounded-md outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring/40"
		>
			<span class="icon-[lucide--x] size-4" aria-hidden="true"></span>
		</button>

		<div class="min-h-0 flex-1 overflow-y-auto">
			{@render children()}
		</div>
		{@render footer?.()}
	</dialog>
{:else if fallbackComponent}
	{@const NativeSheetFallback = fallbackComponent}

	<NativeSheetFallback {trigger} {triggerLabel} {label} {onOpen} {footer} class={className}>
		{@render children()}
	</NativeSheetFallback>
{:else if fallbackError}
	<p role="alert" class="p-4 text-sm text-destructive">
		{m['Components.NativeSheet.fallbackError']()}
	</p>
{/if}

<style>
	dialog {
		position: fixed;
		inset-block: 0;
		inset-inline-start: auto;
		inset-inline-end: 0;
		margin: 0;
		transform: translateX(100%);
		opacity: 0;
		transition:
			transform 180ms cubic-bezier(0.16, 1, 0.3, 1),
			opacity 180ms ease-out,
			display 180ms allow-discrete,
			overlay 180ms allow-discrete;
	}

	dialog:not([open]) {
		display: none;
	}

	dialog[open] {
		display: flex;
		flex-direction: column;
		transform: translateX(0);
		opacity: 1;
	}

	dialog::backdrop {
		background-color: transparent;
		transition:
			background-color 180ms ease-out,
			display 180ms allow-discrete,
			overlay 180ms allow-discrete;
	}

	dialog[open]::backdrop {
		background-color: oklch(0.15 0.02 285 / 0.45);
	}

	@starting-style {
		dialog[open] {
			transform: translateX(100%);
			opacity: 0;
		}

		dialog[open]::backdrop {
			background-color: transparent;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		dialog,
		dialog::backdrop {
			transition-duration: 1ms;
		}
	}
</style>
