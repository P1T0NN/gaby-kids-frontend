<script lang="ts">
	// SVELTEKIT IMPORTS
	import { prefersReducedMotion } from 'svelte/motion';
	import { fly } from 'svelte/transition';

	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Badge } from '@/components/ui/badge/index.js';
	import * as Card from '@/components/ui/card/index.js';
	import NumbersUp from '@/components/ui/custom-components/animations/numbers-up/numbers-up.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';

	let {
		title,
		value,
		change,
		format,
		caption = m['AnalyticsFeature.AnalyticsStatsCard.vsPreviousPeriod']()
	}: {
		title: string;
		value: number;
		change?: number;
		format?: (value: number) => string;
		caption?: string;
	} = $props();

	const duration = $derived(prefersReducedMotion.current ? 0 : 180);
	const isUp = $derived((change ?? 0) >= 0);
	const changeFormat = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
</script>

<Card.Root>
	<Card.Header>
		<Card.Description>{title}</Card.Description>
		<Card.Title class="text-2xl font-semibold tabular-nums">
			<NumbersUp {value} {format} />
		</Card.Title>

		{#if change !== undefined}
			<Card.Action>
				{#key isUp}
					<span
						class="inline-flex"
						in:fly={{ y: isUp ? 3 : -3, duration }}
						out:fly={{ y: isUp ? -3 : 3, duration }}
					>
						<Badge
							variant={isUp ? 'outline' : 'destructive'}
							class={cn(isUp && 'border-transparent bg-success/10 text-success')}
						>
							<span
								class={cn(
									'size-3',
									isUp ? 'icon-[lucide--trending-up]' : 'icon-[lucide--trending-down]'
								)}
								data-icon="inline-start"
								aria-hidden="true"
							></span>
							<NumbersUp value={change ?? 0} format={changeFormat} />
						</Badge>
					</span>
				{/key}
			</Card.Action>
		{:else}
			<Card.Action>
				<Badge variant="outline">{m['AnalyticsFeature.AnalyticsStatsCard.noPreviousData']()}</Badge>
			</Card.Action>
		{/if}
	</Card.Header>

	<Card.Footer class="text-xs text-muted-foreground">{caption}</Card.Footer>
</Card.Root>
