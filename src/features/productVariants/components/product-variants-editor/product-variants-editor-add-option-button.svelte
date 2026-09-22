<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// CONFIG
	import { PRODUCT_VARIANTS_CONFIG } from '@/shared/features/productVariants/config.js';

	// TYPES
	import type { ProductVariantFormValue } from '@/shared/features/productVariants/types/productVariantTypes.js';

	type Props = {
		productVariantOptionNames: string[];
		productVariants: ProductVariantFormValue[];
		disabled?: boolean;
	};

	let {
		productVariantOptionNames = $bindable(),
		productVariants = $bindable(),
		disabled = false
	}: Props = $props();

	const canAddOption = $derived(
		productVariantOptionNames.length < PRODUCT_VARIANTS_CONFIG.MAX_OPTION_COUNT
	);
	// Suggested names are stored option data, so they stay in English like any typed name.
	const hasColorOption = $derived(hasOptionNamed('Color'));
	const hasSizeOption = $derived(hasOptionNamed('Size'));

	function hasOptionNamed(name: string): boolean {
		return productVariantOptionNames.some(
			(optionName) => optionName.trim().toLowerCase() === name.toLowerCase()
		);
	}

	function addProductVariantOption(name: string): void {
		if (!canAddOption) return;

		// A suggested name arrives ready to fill in; the plain button leaves the
		// name empty on purpose and the option values stay disabled until it is named.
		productVariantOptionNames = [...productVariantOptionNames, name];
		productVariants = productVariants.map((productVariant) => ({
			...productVariant,
			options: [...productVariant.options, { name, value: '' }]
		}));
	}
</script>

{#if canAddOption}
	<div class="flex flex-wrap gap-2">
		{#if !hasColorOption}
			<Button
				type="button"
				variant="secondary"
				size="sm"
				{disabled}
				onclick={() => addProductVariantOption('Color')}
			>
				<span class="icon-[lucide--plus] size-4" data-icon="inline-start" aria-hidden="true"></span>
				{m['ProductVariantsFeature.ProductVariantsEditorAddOptionButton.addColor']()}
			</Button>
		{/if}

		{#if !hasSizeOption}
			<Button
				type="button"
				variant="secondary"
				size="sm"
				{disabled}
				onclick={() => addProductVariantOption('Size')}
			>
				<span class="icon-[lucide--plus] size-4" data-icon="inline-start" aria-hidden="true"></span>
				{m['ProductVariantsFeature.ProductVariantsEditorAddOptionButton.addSize']()}
			</Button>
		{/if}

		<Button
			type="button"
			variant="outline"
			size="sm"
			{disabled}
			onclick={() => addProductVariantOption('')}
		>
			<span class="icon-[lucide--plus] size-4" data-icon="inline-start" aria-hidden="true"></span>
			{m['ProductVariantsFeature.ProductVariantsEditorAddOptionButton.addOption']()}
		</Button>
	</div>
{/if}
