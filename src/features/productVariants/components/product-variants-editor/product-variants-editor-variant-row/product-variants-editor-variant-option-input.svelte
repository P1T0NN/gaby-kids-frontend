<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Input } from '@/components/ui/input/index.js';

	// TYPES
	import type { ProductVariantFormValue } from '@/shared/features/productVariants/types/productVariantTypes.js';

	type Props = {
		optionName: string;
		optionValue: string;
		rowIndex: number;
		optionIndex: number;
		productVariants: ProductVariantFormValue[];
		disabled?: boolean;
		/** Submit-time schema error for this option value; empty until a submit fails. */
		error?: string;
	};

	let {
		optionName,
		optionValue,
		rowIndex,
		optionIndex,
		productVariants = $bindable(),
		disabled = false,
		error
	}: Props = $props();

	const isOptionNamed = $derived(Boolean(optionName.trim()));

	function updateProductVariantOptionValue(value: string): void {
		productVariants = productVariants.map((productVariant, currentIndex) =>
			currentIndex === rowIndex
				? {
						...productVariant,
						options: productVariant.options.map((option, innerIndex) =>
							innerIndex === optionIndex ? { ...option, value } : option
						)
					}
				: productVariant
		);
	}
</script>

<Input
	value={optionValue}
	placeholder={optionName ||
		m['ProductVariantsFeature.ProductVariantsEditorVariantOptionInput.optionValuePlaceholder']()}
	aria-label={isOptionNamed
		? m['ProductVariantsFeature.ProductVariantsEditorVariantOptionInput.optionValueLabel']({
				name: optionName
			})
		: m['ProductVariantsFeature.ProductVariantsEditorVariantOptionInput.optionValuePlaceholder']()}
	aria-invalid={error ? true : undefined}
	disabled={disabled || !isOptionNamed}
	class="h-9 w-full"
	oninput={(event) => updateProductVariantOptionValue(event.currentTarget.value)}
/>
{#if error}
	<p class="text-xs text-destructive">{error}</p>
{/if}
