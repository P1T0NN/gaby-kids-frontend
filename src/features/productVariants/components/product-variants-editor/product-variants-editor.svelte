<script lang="ts">
	// COMPONENTS
	import ProductVariantsEditorVariantTabs from './product-variants-editor-variant-tabs.svelte';

	// UTILS
	import { getProductVariantRowErrors } from '../../utils/getProductVariantRowErrors.js';

	// TYPES
	import type { PreviewFile } from '@/features/uploadFile/types/uploadFileTypes.js';
	import type { ProductVariantFormValue } from '@/shared/features/productVariants/types/productVariantTypes.js';

	type Props = {
		productVariants: ProductVariantFormValue[];
		productVariantOptionNames: string[];
		uploadFiles: PreviewFile[];
		trackInventory: boolean;
		disabled?: boolean;
		errors: Readonly<Record<string, string>>;
	};

	let {
		productVariants = $bindable(),
		productVariantOptionNames = $bindable(),
		uploadFiles,
		trackInventory,
		disabled = false,
		errors
	}: Props = $props();

	const formError = $derived(errors.productVariants || errors.productVariantOptionNames || '');
	// Any error in the form means a submit attempt already failed, so the product
	// variant errors must show even when native validation stopped the submit first.
	const hasFormErrors = $derived(Object.keys(errors).length > 0);

	const productVariantRowErrors = $derived(getProductVariantRowErrors(productVariants));
</script>

<div class="flex flex-col gap-5">
	{#if formError}
		<p class="text-sm text-destructive" role="alert">{formError}</p>
	{/if}

	<ProductVariantsEditorVariantTabs
		bind:productVariants
		bind:productVariantOptionNames
		{productVariantRowErrors}
		{uploadFiles}
		{trackInventory}
		{disabled}
		showAllErrors={hasFormErrors}
	/>
</div>
