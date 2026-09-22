<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { Input } from '@/components/ui/input/index.js';
	import { Separator } from '@/components/ui/separator/index.js';
	import ProductVariantDiscountCalculator from '../../product-variant-discount-calculator.svelte';
	import ProductVariantsEditorAddOptionButton from '../product-variants-editor-add-option-button.svelte';
	import ProductVariantsEditorOptionInput from '../product-variants-editor-option-input.svelte';
	import ProductVariantsEditorAmountInput from './product-variants-editor-amount-input.svelte';
	import ProductVariantsEditorVariantImagePicker from './product-variants-editor-variant-image-picker.svelte';
	import ProductVariantsEditorVariantOptionInput from './product-variants-editor-variant-option-input.svelte';

	// UTILS
	import { getGeneratedProductVariantSku } from '@/shared/features/productVariants/utils/getGeneratedProductVariantSku.js';

	// TYPES
	import type { PreviewFile } from '@/features/uploadFile/types/uploadFileTypes.js';
	import type { ProductVariantFormValue } from '@/shared/features/productVariants/types/productVariantTypes.js';

	type Props = {
		productVariant: ProductVariantFormValue;
		rowIndex: number;
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
		productVariant,
		rowIndex,
		productVariants = $bindable(),
		productVariantOptionNames = $bindable(),
		productSlug,
		uploadFiles,
		trackInventory,
		disabled = false,
		errors
	}: Props = $props();

	const rowPath = $derived(`productVariants.${rowIndex}`);
	const optionsError = $derived(errors[`${rowPath}.options`]);
	const combinationError = $derived(errors[rowPath]);
	const skuError = $derived(errors[`${rowPath}.sku`]);
	const priceError = $derived(errors[`${rowPath}.priceInCents`]);
	const discountedPriceError = $derived(errors[`${rowPath}.compareAtPriceInCents`]);
	const inventoryError = $derived(errors[`${rowPath}.inventory`]);
	const imagesError = $derived(errors[`${rowPath}.imageKeys`]);

	// The editor shows a regular price plus an optional discounted price; storage keeps the payable
	// price in `priceInCents` and the regular one in `compareAtPriceInCents` when a discount exists.
	const regularPriceInCents = $derived(
		productVariant.compareAtPriceInCents ?? productVariant.priceInCents
	);
	const discountedPriceInCents = $derived(
		productVariant.compareAtPriceInCents === undefined ? undefined : productVariant.priceInCents
	);
	const hasRegularPrice = $derived(regularPriceInCents !== undefined && regularPriceInCents > 0);

	const generatedSku = $derived(
		getGeneratedProductVariantSku({
			slug: productSlug,
			optionValues: productVariant.options.map((option) => option.value.trim()),
			position: rowIndex
		})
	);
	const displayedSku = $derived(
		productVariant.skuOverridden ? productVariant.sku : productVariant.sku.trim() || generatedSku
	);

	function optionNameError(optionIndex: number): string | undefined {
		return errors[`productVariantOptionNames.${optionIndex}`];
	}

	function optionValueError(optionIndex: number): string | undefined {
		return errors[`${rowPath}.options.${optionIndex}.value`];
	}

	function updateProductVariant(patch: Partial<ProductVariantFormValue>): void {
		productVariants = productVariants.map((currentProductVariant, currentIndex) =>
			currentIndex === rowIndex ? { ...currentProductVariant, ...patch } : currentProductVariant
		);
	}

	function removeProductVariant(): void {
		if (productVariants.length <= 1) return;
		productVariants = productVariants.filter((_, currentIndex) => currentIndex !== rowIndex);
	}

	function setRegularPrice(value: number | undefined): void {
		if (value === undefined) {
			updateProductVariant({ priceInCents: undefined, compareAtPriceInCents: undefined });
			return;
		}

		updateProductVariant(
			productVariant.compareAtPriceInCents === undefined
				? { priceInCents: value }
				: { compareAtPriceInCents: value }
		);
	}

	function setDiscountedPrice(value: number | undefined): void {
		updateProductVariant({
			compareAtPriceInCents: value === undefined ? undefined : regularPriceInCents,
			priceInCents: value === undefined ? regularPriceInCents : value
		});
	}

	function toggleSkuEditing(): void {
		if (productVariant.skuOverridden) {
			updateProductVariant({ skuOverridden: false, sku: '' });
			return;
		}

		updateProductVariant({ skuOverridden: true, sku: displayedSku });
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
					error={optionNameError(optionIndex)}
				/>
			{/each}
		</div>
		{#if productVariantOptionNames.length === 0}
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
								error={optionValueError(optionIndex)}
							/>
						</div>
					{/each}
				</div>
			{/if}
			{#if optionsError}
				<p class="text-xs text-destructive">{optionsError}</p>
			{/if}
			{#if combinationError}
				<p class="text-xs text-destructive">{combinationError}</p>
			{/if}
		</div>

		<div class="flex flex-col gap-2 sm:col-span-2">
			<ProductVariantsEditorVariantImagePicker
				{productVariant}
				{rowIndex}
				bind:productVariants
				{uploadFiles}
				{disabled}
			/>
			{#if imagesError}
				<p class="text-xs text-destructive">{imagesError}</p>
			{/if}
		</div>

		<div class="flex flex-col gap-1.5">
			<span class="text-sm font-medium">
				{m['ProductVariantsFeature.ProductVariantsEditorVariantRow.skuColumn']()}
			</span>
			<div class="flex items-center gap-2">
				<Input
					value={displayedSku}
					placeholder={m['ProductVariantsFeature.ProductVariantsEditorVariantRow.skuPlaceholder']()}
					aria-label={m['ProductVariantsFeature.ProductVariantsEditorVariantRow.skuColumn']()}
					aria-invalid={skuError ? true : undefined}
					disabled={disabled || !productVariant.skuOverridden}
					class="h-9 flex-1"
					oninput={(event) => updateProductVariant({ sku: event.currentTarget.value })}
				/>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					{disabled}
					aria-pressed={productVariant.skuOverridden}
					aria-label={productVariant.skuOverridden
						? m['ProductVariantsFeature.ProductVariantsEditorVariantRow.skuLock']()
						: m['ProductVariantsFeature.ProductVariantsEditorVariantRow.skuUnlock']()}
					onclick={toggleSkuEditing}
				>
					<span
						class={productVariant.skuOverridden
							? 'icon-[lucide--lock-open] size-4'
							: 'icon-[lucide--lock] size-4'}
						aria-hidden="true"
					></span>
				</Button>
			</div>
			<p class="text-xs text-muted-foreground">
				{m['ProductVariantsFeature.ProductVariantsEditorVariantRow.skuAutoHint']()}
			</p>
			{#if skuError}
				<p class="text-xs text-destructive">{skuError}</p>
			{/if}
		</div>

		<div class="flex flex-col gap-1.5">
			<span class="text-sm font-medium">
				{m['ProductVariantsFeature.ProductVariantsEditorVariantRow.priceColumn']()}
			</span>
			<ProductVariantsEditorAmountInput
				value={regularPriceInCents}
				decimals={2}
				placeholder="0.00"
				ariaLabel={m['ProductVariantsFeature.ProductVariantsEditorVariantRow.priceColumn']()}
				invalid={Boolean(priceError)}
				{disabled}
				onValueChange={setRegularPrice}
			/>
			{#if priceError}
				<p class="text-xs text-destructive">{priceError}</p>
			{/if}
		</div>

		<div class="flex flex-col gap-1.5">
			<span class="text-sm font-medium">
				{m['ProductVariantsFeature.ProductVariantsEditorVariantRow.stockColumn']()}
			</span>
			<ProductVariantsEditorAmountInput
				value={productVariant.inventory}
				decimals={0}
				placeholder="0"
				ariaLabel={m['ProductVariantsFeature.ProductVariantsEditorVariantRow.stockColumn']()}
				invalid={Boolean(inventoryError)}
				disabled={disabled || !trackInventory}
				onValueChange={(value) => updateProductVariant({ inventory: value })}
			/>
			{#if inventoryError}
				<p class="text-xs text-destructive">{inventoryError}</p>
			{/if}
		</div>
	</div>

	<Separator />

	<div class="flex flex-col gap-3">
		<div class="flex flex-col gap-1.5 sm:max-w-72">
			<span class="text-sm font-medium">
				{m['ProductVariantsFeature.ProductVariantsEditorVariantRow.discountedPriceColumn']()}
			</span>
			<ProductVariantsEditorAmountInput
				value={discountedPriceInCents}
				decimals={2}
				placeholder="0.00"
				ariaLabel={m[
					'ProductVariantsFeature.ProductVariantsEditorVariantRow.discountedPriceColumn'
				]()}
				invalid={Boolean(discountedPriceError)}
				disabled={disabled || !hasRegularPrice}
				onValueChange={setDiscountedPrice}
			/>
			{#if discountedPriceError}
				<p class="text-xs text-destructive">{discountedPriceError}</p>
			{/if}
		</div>

		<ProductVariantDiscountCalculator bind:productVariants {rowIndex} {disabled} />
	</div>
</div>
