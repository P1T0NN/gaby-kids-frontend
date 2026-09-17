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

	function addProductVariantOption(): void {
		if (productVariantOptionNames.length >= PRODUCT_VARIANTS_CONFIG.MAX_OPTION_COUNT) return;

		// The name starts empty on purpose; the placeholder asks for it first and
		// the option values stay disabled until it is named.
		productVariantOptionNames = [...productVariantOptionNames, ''];
		productVariants = productVariants.map((productVariant) => ({
			...productVariant,
			options: [...productVariant.options, { name: '', value: '' }]
		}));
	}
</script>

{#if productVariantOptionNames.length < PRODUCT_VARIANTS_CONFIG.MAX_OPTION_COUNT}
	<Button type="button" variant="outline" size="sm" {disabled} onclick={addProductVariantOption}>
		<span class="icon-[lucide--plus] size-4" data-icon="inline-start" aria-hidden="true"></span>
		{m['ProductVariantsFeature.ProductVariantsEditorAddOptionButton.addOption']()}
	</Button>
{/if}
