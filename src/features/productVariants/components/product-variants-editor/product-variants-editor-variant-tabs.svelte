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

	let selectedProductVariantIndex = $state(0);

	const activeProductVariantKey = $derived(
		productVariants.length === 0
			? ''
			: String(Math.min(selectedProductVariantIndex, productVariants.length - 1))
	);

	/** Whether a row or any of its fields carries a submit error. */
	const productVariantHasErrors = $derived(
		productVariants.map((_, index) => {
			const rowPath = `productVariants.${index}`;
			return Object.keys(errors).some((path) => path === rowPath || path.startsWith(`${rowPath}.`));
		})
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
				<Tabs.Trigger value={String(index)}>
					{getProductVariantTabLabel(productVariant, index)}
					{#if productVariantHasErrors[index]}
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
				bind:productVariants
				bind:productVariantOptionNames
				{productSlug}
				{uploadFiles}
				{trackInventory}
				{disabled}
				{errors}
			/>
		</Tabs.Content>
	{/each}
</Tabs.Root>
