<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import * as Tabs from '@/components/ui/tabs/index.js';
	import ProductVariantsEditorAddVariantButton from './product-variants-editor-add-variant-button.svelte';
	import ProductVariantsEditorVariantRow from './product-variants-editor-variant-row/product-variants-editor-variant-row.svelte';

	// UTILS
	import { getProductVariantLabel } from '@/shared/features/productVariants/utils/getProductVariantLabel.js';

	// TYPES
	import type { PreviewFile } from '@/features/uploadFile/types/uploadFileTypes.js';
	import type {
		ProductVariantFormValue,
		ProductVariantRowErrors
	} from '@/shared/features/productVariants/types/productVariantTypes.js';

	type Props = {
		productVariants: ProductVariantFormValue[];
		productVariantOptionNames: string[];
		productVariantRowErrors: ProductVariantRowErrors[];
		uploadFiles: PreviewFile[];
		trackInventory: boolean;
		disabled?: boolean;
		/** Reveals every error after a failed submit, even for untouched fields. */
		showAllErrors?: boolean;
	};

	let {
		productVariants = $bindable(),
		productVariantOptionNames = $bindable(),
		productVariantRowErrors,
		uploadFiles,
		trackInventory,
		disabled = false,
		showAllErrors = false
	}: Props = $props();

	let selectedProductVariantIndex = $state(0);

	const activeProductVariantKey = $derived(
		productVariants.length === 0
			? ''
			: String(Math.min(selectedProductVariantIndex, productVariants.length - 1))
	);

	function getProductVariantTabLabel(
		productVariant: ProductVariantFormValue,
		index: number
	): string {
		const hasCompleteOptions =
			productVariant.options.length > 0 &&
			productVariant.options.every((option) => option.value.trim());
		if (hasCompleteOptions) return getProductVariantLabel(productVariant.options);

		return m['ProductVariantsFeature.ProductVariantsEditorVariantTabs.variantLabel']({
			number: index + 1
		});
	}

	function handleProductVariantAdded(productVariantIndex: number): void {
		selectedProductVariantIndex = productVariantIndex;
	}
</script>

<Tabs.Root
	value={activeProductVariantKey}
	onValueChange={(value) => (selectedProductVariantIndex = Number(value))}
	class="gap-4"
>
	<div class="flex flex-wrap items-center gap-2">
		<Tabs.List>
			{#each productVariants as productVariant, index (index)}
				{@const rowErrors = productVariantRowErrors[index]}
				{@const hasErrors =
					showAllErrors && rowErrors !== undefined && Object.keys(rowErrors).length > 0}
				<Tabs.Trigger value={String(index)}>
					{getProductVariantTabLabel(productVariant, index)}
					{#if hasErrors}
						<span class="size-1.5 shrink-0 rounded-full bg-destructive" aria-hidden="true"></span>
						<span class="sr-only">
							{m['ProductVariantsFeature.ProductVariantsEditorVariantTabs.hasErrors']()}
						</span>
					{/if}
				</Tabs.Trigger>
			{/each}
		</Tabs.List>
		<ProductVariantsEditorAddVariantButton
			bind:productVariants
			{productVariantOptionNames}
			{disabled}
			onAdded={handleProductVariantAdded}
		/>
	</div>

	{#each productVariants as productVariant, index (index)}
		<Tabs.Content value={String(index)}>
			<ProductVariantsEditorVariantRow
				{productVariant}
				rowIndex={index}
				rowError={productVariantRowErrors[index]}
				bind:productVariants
				bind:productVariantOptionNames
				{uploadFiles}
				{trackInventory}
				{disabled}
				{showAllErrors}
			/>
		</Tabs.Content>
	{/each}
</Tabs.Root>
