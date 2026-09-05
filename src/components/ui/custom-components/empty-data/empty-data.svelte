<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button';
	import * as Card from '@/components/ui/card/index.js';
	import {
		Empty,
		EmptyContent,
		EmptyDescription,
		EmptyHeader,
		EmptyMedia,
		EmptyTitle
	} from '@/components/ui/empty/index.js';

	// TYPES
	import type { Snippet } from 'svelte';
	import type { EmptyDataAction } from './emptyDataTypes.js';

	// EmptyData: a universal empty-state assembled from shadcn's <Empty>.
	// Title, description, optional icon and action are props — this component
	// only assembles them, the caller authors the text. Drop it straight into
	// a DataList `empty` snippet.
	let {
		title,
		description,
		icon,
		action,
		card = false,
		class: className
	}: {
		/** Heading of the empty state, e.g. "No items yet". */
		title?: string;
		/** Supporting copy under the title. */
		description?: string;
		/** Icon markup rendered in a muted chip above the title. */
		icon?: Snippet;
		/** Standard action rendered below the copy. */
		action?: EmptyDataAction;
		/** Wraps the empty state in the standard Card surface. */
		card?: boolean;
		class?: string;
	} = $props();
</script>

{#snippet emptyContent()}
	<Empty class={className}>
		{#if icon}
			<EmptyMedia variant="icon">
				{@render icon()}
			</EmptyMedia>
		{/if}
		<EmptyHeader>
			{#if title}
				<EmptyTitle>{title}</EmptyTitle>
			{/if}
			{#if description}
				<EmptyDescription>{description}</EmptyDescription>
			{/if}
		</EmptyHeader>
		{#if action}
			<EmptyContent>
				<Button variant="outline" size="sm" href={action.href} onclick={action.onclick}>
					<span class="icon-[lucide--plus] size-4" data-icon="inline-start"></span>
					{action.label}
				</Button>
			</EmptyContent>
		{/if}
	</Empty>
{/snippet}

{#if card}
	<Card.Root>
		<Card.Content class="p-6">{@render emptyContent()}</Card.Content>
	</Card.Root>
{:else}
	{@render emptyContent()}
{/if}
