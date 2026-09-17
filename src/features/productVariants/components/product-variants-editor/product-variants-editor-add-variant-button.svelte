<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// UTILS
	import { createProductVariantFormValue } from '../../utils/productVariantFormValues.js';

	// TYPES
	import type { ProductVariantFormValue } from '@/shared/features/productVariants/types/productVariantTypes.js';

	type Props = {
		productVariants: ProductVariantFormValue[];
		productVariantOptionNames: string[];
		disabled?: boolean;
		onAdded?: (productVariantIndex: number) => void;
	};

	let {
		productVariants = $bindable(),
		productVariantOptionNames,
		disabled = false,
		onAdded
	}: Props = $props();

	function addProductVariant(): void {
		productVariants = [
			...productVariants,
			createProductVariantFormValue(productVariantOptionNames)
		];
		onAdded?.(productVariants.length - 1);
	}
</script>

<Button
	type="button"
	variant="outline"
	size="sm"
	class="w-fit"
	{disabled}
	onclick={addProductVariant}
>
	<span class="icon-[lucide--plus] size-4" data-icon="inline-start" aria-hidden="true"></span>
	{m['ProductVariantsFeature.ProductVariantsEditorAddVariantButton.addVariant']()}
</Button>
