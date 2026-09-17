<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { Input } from '@/components/ui/input/index.js';
	import { Separator } from '@/components/ui/separator/index.js';

	// UTILS
	import { priceInCents } from '@/shared/utils/pricing.js';
	import ProductVariantDiscountCalculator from '../../product-variant-discount-calculator.svelte';
	import ProductVariantsEditorAddOptionButton from '../product-variants-editor-add-option-button.svelte';
	import ProductVariantsEditorOptionInput from '../product-variants-editor-option-input.svelte';
	import ProductVariantsEditorVariantImagePicker from './product-variants-editor-variant-image-picker.svelte';
	import ProductVariantsEditorVariantOptionInput from './product-variants-editor-variant-option-input.svelte';

	// TYPES
	import type { PreviewFile } from '@/features/uploadFile/types/uploadFileTypes.js';
	import type {
		ProductVariantFormValue,
		ProductVariantRowErrors
	} from '@/shared/features/productVariants/types/productVariantTypes.js';

	type Props = {
		productVariant: ProductVariantFormValue;
		rowIndex: number;
		rowError: ProductVariantRowErrors | undefined;
		productVariants: ProductVariantFormValue[];
		productVariantOptionNames: string[];
		uploadFiles: PreviewFile[];
		trackInventory: boolean;
		disabled?: boolean;
		/** Reveals every error after a failed submit, even for untouched fields. */
		showAllErrors?: boolean;
	};

	let {
		productVariant,
		rowIndex,
		rowError,
		productVariants = $bindable(),
		productVariantOptionNames = $bindable(),
		uploadFiles,
		trackInventory,
		disabled = false,
		showAllErrors = false
	}: Props = $props();

	const hasMissingProductVariantOptionName = $derived(
		productVariantOptionNames.some((optionName) => !optionName.trim())
	);
	const regularPriceInCents = $derived(priceInCents(productVariant.price));
	const hasRegularPrice = $derived(
		Number.isSafeInteger(regularPriceInCents) && regularPriceInCents > 0
	);

	// Every product variant error stays hidden until a submit attempt fails.
	const showOptionsError = $derived(
		showAllErrors && Boolean(rowError?.options) && !hasMissingProductVariantOptionName
	);
	const showSkuError = $derived(showAllErrors && Boolean(rowError?.sku));
	const showPriceError = $derived(showAllErrors && Boolean(rowError?.price));
	const showDiscountedPriceError = $derived(showAllErrors && Boolean(rowError?.discountedPrice));
	const showInventoryError = $derived(showAllErrors && Boolean(rowError?.inventory));
	const showCombinationError = $derived(showAllErrors && Boolean(rowError?.combination));

	function updateProductVariant(patch: Partial<ProductVariantFormValue>): void {
		productVariants = productVariants.map((currentProductVariant, currentIndex) =>
			currentIndex === rowIndex ? { ...currentProductVariant, ...patch } : currentProductVariant
		);
	}

	function removeProductVariant(): void {
		if (productVariants.length <= 1) return;
		productVariants = productVariants.filter((_, currentIndex) => currentIndex !== rowIndex);
	}
</script>

<div class="relative flex flex-col gap-4 rounded-xl border border-border p-4 pe-12">
	<Button
		type="button"
		variant="ghost"
		size="icon-sm"
		class="absolute end-2 top-2 text-muted-foreground hover:text-destructive"
		aria-label={m['ProductVariantsFeature.ProductVariantsEditorVariantRow.removeVariant']({
			number: rowIndex + 1
		})}
		disabled={disabled || productVariants.length <= 1}
		onclick={removeProductVariant}
	>
		<span class="icon-[lucide--trash-2] size-4" aria-hidden="true"></span>
	</Button>

	<div class="flex flex-col gap-2">
		<span class="text-sm font-medium">
			{m['ProductVariantsFeature.ProductVariantsEditor.options']()}
		</span>
		<div class="flex flex-col gap-2">
			{#each productVariantOptionNames as optionName, optionIndex (optionIndex)}
				<ProductVariantsEditorOptionInput
					{optionName}
					{optionIndex}
					bind:productVariantOptionNames
					bind:productVariants
					{disabled}
					showError={showAllErrors}
				/>
			{/each}
		</div>
		{#if hasMissingProductVariantOptionName && showAllErrors}
			<p class="text-xs text-destructive" role="alert">
				{m['ProductVariantsFeature.ProductVariantsEditor.optionNameRequired']()}
			</p>
		{:else if productVariantOptionNames.length === 0}
			<p class="text-xs text-muted-foreground">
				{m['ProductVariantsFeature.ProductVariantsEditor.noOptionsHint']()}
			</p>
		{/if}
		<ProductVariantsEditorAddOptionButton
			bind:productVariantOptionNames
			bind:productVariants
			{disabled}
		/>
	</div>

	<Separator />

	<div class="grid gap-4 sm:grid-cols-2">
		<div class="flex flex-col gap-1.5 sm:col-span-2">
			{#if productVariant.options.length === 0}
				<span class="text-sm font-medium">
					{m['ProductVariantsFeature.ProductVariantsEditorVariantRow.variantColumn']()}
				</span>
				<span class="text-sm text-muted-foreground">
					{m['ProductVariantsFeature.ProductVariantsEditorVariantRow.defaultVariant']()}
				</span>
			{:else}
				<div class="grid gap-4 sm:grid-cols-2">
					{#each productVariant.options as option, optionIndex (optionIndex)}
						<div class="flex flex-col gap-1.5">
							<span class="text-sm font-medium">
								{option.name ||
									m['ProductVariantsFeature.ProductVariantsEditorVariantRow.variantColumn']()}
							</span>
							<ProductVariantsEditorVariantOptionInput
								optionName={option.name}
								optionValue={option.value}
								{rowIndex}
								{optionIndex}
								bind:productVariants
								{disabled}
								showError={showAllErrors}
							/>
						</div>
					{/each}
				</div>
			{/if}
			{#if showOptionsError}
				<p class="text-xs text-destructive">{rowError?.options}</p>
			{/if}
			{#if showCombinationError}
				<p class="text-xs text-destructive">{rowError?.combination}</p>
			{/if}
		</div>

		<div class="sm:col-span-2">
			<ProductVariantsEditorVariantImagePicker
				{productVariant}
				{rowIndex}
				bind:productVariants
				{uploadFiles}
				{disabled}
			/>
		</div>

		<div class="flex flex-col gap-1.5">
			<span class="text-sm font-medium">
				{m['ProductVariantsFeature.ProductVariantsEditorVariantRow.skuColumn']()}
			</span>
			<Input
				value={productVariant.sku}
				placeholder={m['ProductVariantsFeature.ProductVariantsEditorVariantRow.skuPlaceholder']()}
				aria-label={m['ProductVariantsFeature.ProductVariantsEditorVariantRow.skuColumn']()}
				aria-invalid={showSkuError ? true : undefined}
				{disabled}
				class="h-9"
				oninput={(event) => updateProductVariant({ sku: event.currentTarget.value })}
			/>
			{#if showSkuError}
				<p class="text-xs text-destructive">{rowError?.sku}</p>
			{/if}
		</div>

		<div class="flex flex-col gap-1.5">
			<span class="text-sm font-medium">
				{m['ProductVariantsFeature.ProductVariantsEditorVariantRow.priceColumn']()}
			</span>
			<Input
				type="number"
				min="0.01"
				step="0.01"
				value={productVariant.price}
				placeholder="0.00"
				aria-label={m['ProductVariantsFeature.ProductVariantsEditorVariantRow.priceColumn']()}
				aria-invalid={showPriceError ? true : undefined}
				{disabled}
				class="h-9"
				oninput={(event) => updateProductVariant({ price: event.currentTarget.value })}
			/>
			{#if showPriceError}
				<p class="text-xs text-destructive">{rowError?.price}</p>
			{/if}
		</div>

		<div class="flex flex-col gap-1.5">
			<span class="text-sm font-medium">
				{m['ProductVariantsFeature.ProductVariantsEditorVariantRow.stockColumn']()}
			</span>
			<Input
				type="number"
				min="0"
				step="1"
				value={productVariant.inventory}
				placeholder="0"
				aria-label={m['ProductVariantsFeature.ProductVariantsEditorVariantRow.stockColumn']()}
				aria-invalid={showInventoryError ? true : undefined}
				disabled={disabled || !trackInventory}
				class="h-9"
				oninput={(event) => updateProductVariant({ inventory: event.currentTarget.value })}
			/>
			{#if showInventoryError}
				<p class="text-xs text-destructive">{rowError?.inventory}</p>
			{/if}
		</div>
	</div>

	<Separator />

	<div class="flex flex-col gap-3">
		<div class="flex flex-col gap-1.5 sm:max-w-72">
			<span class="flex flex-wrap items-baseline gap-x-2">
				<span class="text-sm font-medium">
					{m['ProductVariantsFeature.ProductVariantsEditorVariantRow.discountedPriceColumn']()}
				</span>
				{#if !hasRegularPrice}
					<span class="text-xs text-muted-foreground">
						{m[
							'ProductVariantsFeature.ProductVariantsEditorVariantRow.discountedPriceRequiresPrice'
						]()}
					</span>
				{/if}
			</span>
			<Input
				type="number"
				min="0.01"
				step="0.01"
				value={productVariant.discountedPrice}
				placeholder="0.00"
				aria-label={m[
					'ProductVariantsFeature.ProductVariantsEditorVariantRow.discountedPriceColumn'
				]()}
				aria-invalid={showDiscountedPriceError ? true : undefined}
				disabled={disabled || !hasRegularPrice}
				class="h-9"
				oninput={(event) => updateProductVariant({ discountedPrice: event.currentTarget.value })}
			/>
			{#if showDiscountedPriceError}
				<p class="text-xs text-destructive">{rowError?.discountedPrice}</p>
			{/if}
		</div>

		<ProductVariantDiscountCalculator bind:productVariants {rowIndex} {disabled} />
	</div>
</div>
