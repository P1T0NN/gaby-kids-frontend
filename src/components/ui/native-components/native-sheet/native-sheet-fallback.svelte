<script lang="ts">
	// UTILS
	import { cn } from '@/utils/utils.js';

	// COMPONENTS
	import * as Sheet from '@/components/ui/sheet/index.js';
	import { m } from '@/lib/paraglide/messages';

	// TYPES
	import type { Snippet } from 'svelte';

	let {
		id,
		trigger,
		children,
		footer,
		class: className,
		label,
		triggerLabel,
		onOpen
	}: {
		id: string;
		trigger?: Snippet;
		children: Snippet;
		footer?: Snippet;
		class?: string;
		label: string;
		triggerLabel?: string;
		onOpen?: () => void;
	} = $props();
</script>

<Sheet.Root
	onOpenChange={(open) => {
		if (open) onOpen?.();
	}}
>
	{#if trigger}
		<Sheet.Trigger
			id={`${id}-trigger`}
			aria-label={triggerLabel ?? m['Components.NativeSheetFallback.open']()}
			class="inline-flex cursor-pointer items-center justify-center rounded-md p-2 transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40"
		>
			{@render trigger()}
		</Sheet.Trigger>
	{:else}
		<Sheet.Trigger id={`${id}-trigger`} aria-label={m['Components.NativeSheetFallback.open']()}>
			{m['Components.NativeSheetFallback.open']()}
		</Sheet.Trigger>
	{/if}

	<Sheet.Content
		side="right"
		class={cn(
			'box-border flex h-dvh max-h-none w-full max-w-md flex-col overflow-hidden border bg-sidebar p-6 pt-14 text-sidebar-foreground',
			className
		)}
	>
		<Sheet.Header class="sr-only">
			<Sheet.Title>{label}</Sheet.Title>
			<Sheet.Description>{m['Components.NativeSheetFallback.description']()}</Sheet.Description>
		</Sheet.Header>

		<div class="min-h-0 flex-1 overflow-y-auto">
			{@render children()}
		</div>
		{@render footer?.()}
	</Sheet.Content>
</Sheet.Root>
