<script lang="ts">
	// COMPONENTS
	import ProductVariantPickerValue from './product-variant-picker-value.svelte';

	// UTILS
	import { getProductVariantOptionGroups } from '@/features/productVariants/utils/getProductVariantOptionGroups.js';

	// TYPES
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
</script>

<div class="flex flex-col gap-4">
	{#each productVariantOptionGroups as group, groupIndex (group.name)}
		<div class="flex flex-col gap-2">
			<span class="text-sm font-medium">{group.name}</span>
			<div class="flex flex-wrap gap-2" role="group" aria-label={group.name}>
				{#each group.values as value (value)}
					<ProductVariantPickerValue
						{productVariants}
						{selectedOptionValues}
						{groupIndex}
						{value}
						trackInventory={product.trackInventory}
						{onSelectProductVariant}
						{disabled}
					/>
				{/each}
			</div>
		</div>
	{/each}
</div>
