<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { Spinner } from '@/components/ui/spinner/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	let {
		pending = false,
		cancelLabel,
		confirmLabel,
		onCancel,
		onConfirm,
		confirmType = 'button',
		confirmDisabled = false,
		class: className
	}: {
		/** Disables both buttons and shows the confirm spinner. */
		pending?: boolean;
		cancelLabel: string;
		confirmLabel: string;
		onCancel: () => void;
		/** Omit for a `submit` confirm button inside a dialog form. */
		onConfirm?: () => void | Promise<void>;
		/** `submit` keeps the confirm button working inside a dialog form. */
		confirmType?: 'button' | 'submit';
		/** Extra condition that disables the confirm button. */
		confirmDisabled?: boolean;
		class?: string;
	} = $props();
</script>

<div class={cn('flex justify-end gap-2', className)}>
	<Button type="button" variant="outline" size="sm" onclick={onCancel} disabled={pending}>
		{cancelLabel}
	</Button>
	<Button
		type={confirmType}
		variant="destructive"
		size="sm"
		onclick={onConfirm}
		disabled={pending || confirmDisabled}
	>
		{#if pending}
			<Spinner data-icon="inline-start" />
		{/if}
		{confirmLabel}
	</Button>
</div>
