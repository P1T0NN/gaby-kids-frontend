<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button';
	import * as Card from '@/components/ui/card/index.js';
	import { m } from '@/lib/paraglide/messages';

	// UTILS
	import { cn } from '@/utils/utils.js';

	type Props = {
		message?: string;
		retry?: () => void;
		retryLabel?: string;
		card?: boolean;
		class?: string;
	};

	let {
		message = m['Components.ErrorComponent.somethingWentWrong'](),
		retry = () => globalThis.location?.reload(),
		retryLabel = m['Components.ErrorComponent.retry'](),
		card = false,
		class: className
	}: Props = $props();
</script>

{#snippet errorContent()}
	<div class={cn('flex flex-col items-center gap-3 py-10 text-center', className)} role="alert">
		<p class="text-sm text-destructive">{message}</p>
		<Button type="button" variant="outline" size="sm" onclick={retry}>{retryLabel}</Button>
	</div>
{/snippet}

{#if card}
	<Card.Root>
		<Card.Content class="p-0">{@render errorContent()}</Card.Content>
	</Card.Root>
{:else}
	{@render errorContent()}
{/if}
