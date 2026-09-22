<script lang="ts">
	// COMPONENTS
	import ProductVariantsEditorVariantTabs from './product-variants-editor-variant-tabs.svelte';

	// TYPES
	import type { PreviewFile } from '@/features/uploadFile/types/uploadFileTypes.js';
	import type { ProductVariantFormValue } from '@/shared/features/productVariants/types/productVariantTypes.js';

	type Props = {
		productVariants: ProductVariantFormValue[];
		productVariantOptionNames: string[];
		productSlug: string;
		uploadFiles: PreviewFile[];
		trackInventory: boolean;
		disabled?: boolean;
		/** Submit-time schema errors keyed by field path; empty until a submit fails. */
		errors: Readonly<Record<string, string>>;
	};

	let {
		productVariants = $bindable(),
		productVariantOptionNames = $bindable(),
		productSlug,
		uploadFiles,
		trackInventory,
		disabled = false,
		errors
	}: Props = $props();

	const formError = $derived(errors.productVariants || errors.productVariantOptionNames || '');
</script>

<div class="flex flex-col gap-5">
	{#if formError}
		<p class="text-sm text-destructive" role="alert">{formError}</p>
	{/if}

	<ProductVariantsEditorVariantTabs
		bind:productVariants
		bind:productVariantOptionNames
		{productSlug}
		{uploadFiles}
		{trackInventory}
		{disabled}
		{errors}
	/>
</div>
