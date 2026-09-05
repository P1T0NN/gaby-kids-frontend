<script lang="ts">
	// UTILS
	import { cn } from '@/utils/utils.js';
	import { m } from '@/lib/paraglide/messages';

	// TYPES
	import type { Snippet } from 'svelte';

	// Native <dialog> modal: the browser blocks the page behind it, centers it
	// with a backdrop, and focuses the first control. Click-outside can never
	// close a modal <dialog>; Esc is disabled by cancelling the `cancel` event,
	// so the only exits are the built-in close button and caller affordances via the
	// `close` snippet arg. The dialog element is the source of truth — `open`
	// and `close` are plain event handlers on the native API, so there is no
	// state to sync and no $effect. The trigger snippet must be a button (or
	// another element with `onclick`); pass the `open` handler to it.
	let {
		trigger,
		children,
		closeLabel = m['Components.NativeDialog.close'](),
		class: className
	}: {
		trigger?: Snippet<[{ open: () => void }]>;
		children: Snippet<[{ close: () => void }]>;
		closeLabel?: string;
		class?: string;
	} = $props();

	let dialogEl = $state<HTMLDialogElement>();

	function setDialogElement(element: HTMLDialogElement) {
		dialogEl = element;
	}

	const open = () => dialogEl?.showModal();
	const close = () => dialogEl?.close();
</script>

{#if trigger}
	{@render trigger?.({ open })}
{/if}

<dialog
	{@attach setDialogElement}
	oncancel={(e) => e.preventDefault()}
	class={cn(
		'm-auto box-border max-h-[calc(100dvh-2rem)] w-full max-w-[min(28rem,calc(100dvw-2rem))] overflow-x-hidden overflow-y-auto rounded-2xl border bg-popover p-0 text-start whitespace-normal text-popover-foreground shadow-lg wrap-anywhere backdrop:bg-black/50 backdrop:backdrop-blur-sm',
		className
	)}
>
	<button
		type="button"
		aria-label={closeLabel}
		class="absolute top-4 right-4 inline-flex size-8 cursor-pointer items-center justify-center rounded-md outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40"
		onclick={close}
	>
		<span class="icon-[lucide--x] size-4" aria-hidden="true"></span>
	</button>

	{@render children?.({ close })}
</dialog>
