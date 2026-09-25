<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// CONFIG
	import { ORDER_CONFIG } from '@/shared/features/orders/config.js';

	// COMPONENTS
	import { Progress } from '@/components/ui/progress/index.js';

	// UTILS
	import { formatPrice } from '@/shared/utils/pricing.js';
	import { getFreeShippingRemainingInCents } from '@/shared/features/orders/utils/getFreeShippingRemainingInCents.js';
	import { cn } from '@/utils/utils.js';

	let { subtotalInCents, class: className }: { subtotalInCents: number; class?: string } = $props();

	const thresholdInCents = ORDER_CONFIG.freeShippingThresholdInCents;
	const isEnabled = ORDER_CONFIG.shippingFeeInCents > 0 && thresholdInCents > 0;
	const remainingInCents = $derived(getFreeShippingRemainingInCents(subtotalInCents));
	const isUnlocked = $derived(remainingInCents === 0);
	const isAlmostThere = $derived(!isUnlocked && remainingInCents <= thresholdInCents * 0.2);
	const progress = $derived(
		thresholdInCents > 0 ? Math.min((subtotalInCents / thresholdInCents) * 100, 100) : 100
	);
</script>

{#if isEnabled}
	<div class={cn('flex flex-col gap-2 rounded-xl bg-muted/50 p-3', className)}>
		<p class="flex items-center gap-2 text-sm" role="status" aria-live="polite">
			<span
				class={cn(
					'size-4 shrink-0',
					isUnlocked
						? 'icon-[lucide--circle-check] text-success'
						: 'icon-[lucide--truck] text-muted-foreground'
				)}
				aria-hidden="true"
			></span>
			<span class={isUnlocked ? 'font-medium text-success' : undefined}>
				{#if isUnlocked}
					{m['OrdersFeature.FreeShippingNudge.unlocked']()}
				{:else if isAlmostThere}
					{m['OrdersFeature.FreeShippingNudge.almostThere']({
						amount: formatPrice(remainingInCents)
					})}
				{:else}
					{m['OrdersFeature.FreeShippingNudge.remaining']({
						amount: formatPrice(remainingInCents)
					})}
				{/if}
			</span>
		</p>

		{#if !isUnlocked}
			<Progress
				value={progress}
				aria-label={m['OrdersFeature.FreeShippingNudge.progressLabel']()}
			/>
		{/if}
	</div>
{/if}
