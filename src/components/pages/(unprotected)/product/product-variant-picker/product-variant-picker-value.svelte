<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import NativeTooltip from '@/components/ui/native-components/native-tooltip/native-tooltip.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';
	import { resolveProductVariantOptionValue } from '@/features/productVariants/utils/resolveProductVariantOptionValue.js';

	// TYPES
	import type { ProductVariantOptionUnavailableReason } from '@/shared/features/productVariants/types/productVariantTypes.js';
	import type { FunctionReturnType } from 'convex/server';
	import type { api } from '@convex/_generated/api';

	type StorefrontProductVariant = NonNullable<
		FunctionReturnType<typeof api.tables.products.queries.fetchProductBySlug.fetchProductBySlug>
	>['productVariants'][number];

	let {
		productVariants,
		selectedOptionValues,
		groupIndex,
		value,
		trackInventory,
		onSelectProductVariant,
		disabled = false
	}: {
		productVariants: StorefrontProductVariant[];
		selectedOptionValues: string[];
		groupIndex: number;
		value: string;
		trackInventory: boolean;
		onSelectProductVariant: (productVariantId: string) => void;
		disabled?: boolean;
	} = $props();

	const optionResolution = $derived(
		resolveProductVariantOptionValue(groupIndex, value, {
			productVariants,
			selectedOptionValues,
			trackInventory
		})
	);

	const productVariant = $derived(optionResolution.productVariant);
	const isSelected = $derived(selectedOptionValues[groupIndex] === value);

	const unavailableReason = $derived(
		optionResolution.unavailableReason
			? getUnavailableReasonLabel(optionResolution.unavailableReason)
			: undefined
	);
	// Only stock states are spelled out inline; a combination that never existed
	// is clear from the selected values and stays tooltip-only.
	const isInventoryUnavailable = $derived(
		optionResolution.unavailableReason === 'sold_out' ||
			optionResolution.unavailableReason === 'temporarily_unavailable'
	);
	const tooltipId = $derived(
		`product-variant-option-${groupIndex}-${value.replace(/[^a-zA-Z0-9_-]/g, '-')}`
	);

	function getUnavailableReasonLabel(reason: ProductVariantOptionUnavailableReason): string {
		if (reason === 'incompatible') {
			return m['ProductPage.ProductVariantPicker.notAvailableWith']({
				selection: selectedOptionValues.slice(0, groupIndex).join(' / ')
			});
		}
		if (reason === 'sold_out') return m['CartFeature.Cart.soldOut']();
		return m['CartFeature.Cart.temporarilyUnavailable']();
	}
</script>

{#snippet optionPill(isUnavailable: boolean)}
	<span
		class={cn(
			'inline-flex min-h-10 min-w-10 items-center justify-center gap-1 rounded-full border px-3 text-sm transition-colors',
			isSelected ? 'border-primary bg-primary/5 font-medium' : 'border-border',
			!isSelected && !isUnavailable && 'hover:border-foreground/30',
			!isSelected && isUnavailable && 'text-muted-foreground opacity-50'
		)}
	>
		<span class={cn(!isSelected && isUnavailable && 'line-through')}>{value}</span>
		{#if isUnavailable && isInventoryUnavailable && unavailableReason}
			<span class="text-xs">— {unavailableReason}</span>
		{/if}
	</span>
{/snippet}

{#if unavailableReason !== undefined && !isSelected}
	{#snippet optionTrigger()}
		{@render optionPill(true)}
	{/snippet}

	<NativeTooltip
		id={tooltipId}
		trigger={optionTrigger}
		triggerLabel={`${value} — ${unavailableReason}`}
		side="top"
	>
		{unavailableReason}
	</NativeTooltip>
{:else}
	<button
		type="button"
		aria-pressed={isSelected}
		{disabled}
		class="inline-flex rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
		onclick={() => productVariant && onSelectProductVariant(productVariant._id)}
	>
		{@render optionPill(false)}
	</button>
{/if}
