<script lang="ts">
	// LIBRARIES
	import { onDestroy } from 'svelte';
	import { m } from '@/lib/paraglide/messages';

	let {
		label,
		value,
		ariaLabel = m['Components.CopyValue.copy']({ label })
	}: {
		label: string;
		value: string;
		ariaLabel?: string;
	} = $props();

	let copied = $state(false);
	let resetTimer: ReturnType<typeof setTimeout> | undefined;

	async function copyValue(): Promise<void> {
		try {
			await navigator.clipboard.writeText(value);
			copied = true;
			clearTimeout(resetTimer);
			resetTimer = setTimeout(() => (copied = false), 1500);
		} catch {
			// The value remains visible and selectable when clipboard access is unavailable.
		}
	}

	onDestroy(() => clearTimeout(resetTimer));
</script>

<div class="flex min-w-0 items-center gap-1.5">
	<span class="text-muted-foreground">{label}:</span>
	<button
		type="button"
		onclick={copyValue}
		aria-label={copied ? m['Components.CopyValue.copied']({ label }) : ariaLabel}
		title={value}
		class="group inline-flex min-w-0 items-center gap-1.5 rounded-sm font-mono text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
	>
		<span class="max-w-[9rem] truncate sm:max-w-[14rem]">{value}</span>
		{#if copied}
			<span class="text-primary">
				<span class="icon-[lucide--check] size-3.5" aria-hidden="true"></span>
			</span>
		{:else}
			<span
				class="opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
			>
				<span class="icon-[lucide--copy] size-3" aria-hidden="true"></span>
			</span>
		{/if}
		<span class="sr-only" aria-live="polite">
			{copied ? m['Components.CopyValue.copied']({ label }) : ''}
		</span>
	</button>
</div>
