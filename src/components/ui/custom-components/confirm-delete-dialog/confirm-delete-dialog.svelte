<script lang="ts">
	// COMPONENTS
	import NativeDialog from '@/components/ui/native-components/native-dialog/native-dialog.svelte';
	import ConfirmDialogActions from '../confirm-dialog-actions/confirm-dialog-actions.svelte';

	// TYPES
	import type { Snippet } from 'svelte';

	let {
		title,
		description,
		confirmLabel,
		cancelLabel,
		pending = false,
		onConfirm,
		trigger
	}: {
		title: string;
		description: string;
		confirmLabel: string;
		cancelLabel: string;
		pending?: boolean;
		/** Receives the dialog's close callback so callers can close on success. */
		onConfirm: (close: () => void) => void | Promise<void>;
		/** Dialog trigger; receives the dialog's open callback. */
		trigger: Snippet<[{ open: () => void }]>;
	} = $props();
</script>

<NativeDialog {trigger}>
	{#snippet children({ close })}
		<div class="flex flex-col gap-5 p-6">
			<div class="flex flex-col gap-1.5">
				<h2 class="text-lg font-semibold">{title}</h2>
				<p class="text-sm text-muted-foreground">{description}</p>
			</div>

			<ConfirmDialogActions
				{pending}
				{cancelLabel}
				{confirmLabel}
				onCancel={close}
				onConfirm={() => onConfirm(close)}
			/>
		</div>
	{/snippet}
</NativeDialog>
