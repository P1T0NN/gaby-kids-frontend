<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// UTILS
	import { cn } from '@/utils/utils.js';
	import { getProductVariantAvailability } from '@/features/productVariants/utils/getProductVariantAvailability.js';
	import {
		findProductVariantByOptionValues,
		getProductVariantOptionGroups
	} from '@/features/productVariants/utils/productVariantOptionGroups.js';

	// TYPES
	import type { ProductAvailability } from '@/shared/features/products/types/productsTypes.js';
	import type { FunctionReturnType } from 'convex/server';
	import type { api } from '@convex/_generated/api';

	type StorefrontProduct = NonNullable<
		FunctionReturnType<typeof api.tables.products.queries.fetchProductBySlug.fetchProductBySlug>
	>;
	type StorefrontProductVariant = StorefrontProduct['productVariants'][number];

	type Props = {
		product: StorefrontProduct;
		productVariants: StorefrontProductVariant[];
		selectedProductVariantId: string;
		onSelectProductVariant: (productVariantId: string) => void;
		disabled?: boolean;
	};

	let {
		product,
		productVariants,
		selectedProductVariantId,
		onSelectProductVariant,
		disabled = false
	}: Props = $props();

	const productVariantOptionGroups = $derived(
		getProductVariantOptionGroups(product.productVariantOptionNames, productVariants)
	);
	const selectedProductVariant = $derived(
		productVariants.find((productVariant) => productVariant._id === selectedProductVariantId) ??
			productVariants[0]
	);
	const selectedOptionValues = $derived(
		productVariantOptionGroups.map((group, groupIndex) =>
			(selectedProductVariant?.options[groupIndex]?.value ?? group.values[0] ?? '').trim()
		)
	);

	function getProductVariantForOptionValue(
		groupIndex: number,
		value: string
	): StorefrontProductVariant | undefined {
		const candidateOptionValues = selectedOptionValues.map((selectedValue, index) =>
			index === groupIndex ? value : selectedValue
		);
		return findProductVariantByOptionValues(productVariants, candidateOptionValues);
	}

	function getOptionValueTitle(
		value: string,
		availability: ProductAvailability | undefined
	): string {
		if (availability?.type === 'sold_out') {
			return `${value} — ${m['CartFeature.Cart.soldOut']()}`;
		}
		if (availability?.type === 'temporarily_unavailable') {
			return `${value} — ${m['CartFeature.Cart.temporarilyUnavailable']()}`;
		}
		return value;
	}
</script>

<div class="flex flex-col gap-4">
	{#each productVariantOptionGroups as group, groupIndex (group.name)}
		<div class="flex flex-col gap-2">
			<span class="text-sm font-medium">{group.name}</span>
			<div class="flex flex-wrap gap-2" role="group" aria-label={group.name}>
				{#each group.values as value (value)}
					{@const productVariant = getProductVariantForOptionValue(groupIndex, value)}
					{@const availability = productVariant
						? getProductVariantAvailability(product, productVariant)
						: undefined}
					{@const isUnavailable =
						availability?.type === 'sold_out' || availability?.type === 'temporarily_unavailable'}
					{@const isSelected = selectedOptionValues[groupIndex] === value}
					<button
						type="button"
						aria-pressed={isSelected}
						disabled={disabled || (!isSelected && (productVariant === undefined || isUnavailable))}
						title={getOptionValueTitle(value, availability)}
						class={cn(
							'inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50',
							isSelected
								? 'border-primary bg-primary/5 font-medium'
								: 'border-border hover:border-foreground/30',
							!isSelected && isUnavailable && 'text-muted-foreground line-through'
						)}
						onclick={() => productVariant && onSelectProductVariant(productVariant._id)}
					>
						{value}
						{#if !isSelected && availability !== undefined && isUnavailable}
							<span class="sr-only">
								{availability.type === 'sold_out'
									? m['CartFeature.Cart.soldOut']()
									: m['CartFeature.Cart.temporarilyUnavailable']()}
							</span>
						{/if}
					</button>
				{/each}
			</div>
		</div>
	{/each}
</div>
