<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import UploadFilePreviewItem from '@/features/uploadFile/components/upload-file-preview-item.svelte';

	// TYPES
	import type { PreviewFile } from '@/features/uploadFile/types/uploadFileTypes.js';
	import type { ProductVariantFormValue } from '@/shared/features/productVariants/types/productVariantTypes.js';

	type Props = {
		productVariant: ProductVariantFormValue;
		rowIndex: number;
		productVariants: ProductVariantFormValue[];
		uploadFiles: PreviewFile[];
		disabled?: boolean;
	};

	let {
		productVariant,
		rowIndex,
		productVariants = $bindable(),
		uploadFiles,
		disabled = false
	}: Props = $props();

	function updateProductVariantImageKeys(imageKeys: string[]): void {
		productVariants = productVariants.map((currentProductVariant, currentIndex) =>
			currentIndex === rowIndex ? { ...currentProductVariant, imageKeys } : currentProductVariant
		);
	}

	function assignProductVariantImage(previewId: string): void {
		updateProductVariantImageKeys([...productVariant.imageKeys, previewId]);
	}

	/** Library images not yet applied to this variant; applied ones live below. */
	const unassignedProductVariantImages = $derived(
		uploadFiles
			.map((preview, libraryIndex) => ({ preview, libraryNumber: libraryIndex + 1 }))
			.filter(({ preview }) => !productVariant.imageKeys.includes(preview.id))
	);

	const appliedProductVariantImages = $derived(
		productVariant.imageKeys.flatMap((imageId) => {
			const preview = uploadFiles.find((candidate) => candidate.id === imageId);
			return preview ? [preview] : [];
		})
	);

	function removeProductVariantImage(index: number): void {
		const imageId = appliedProductVariantImages[index]?.id;
		if (imageId === undefined) return;
		updateProductVariantImageKeys(
			productVariant.imageKeys.filter((currentId) => currentId !== imageId)
		);
	}

	function moveProductVariantImage(index: number, direction: -1 | 1): void {
		const imageId = appliedProductVariantImages[index]?.id;
		const targetImageId = appliedProductVariantImages[index + direction]?.id;
		if (imageId === undefined || targetImageId === undefined) return;

		updateProductVariantImageKeys(
			productVariant.imageKeys.map((currentId) => {
				if (currentId === imageId) return targetImageId;
				if (currentId === targetImageId) return imageId;
				return currentId;
			})
		);
	}

	function setProductVariantCoverImage(index: number): void {
		const imageId = appliedProductVariantImages[index]?.id;
		if (imageId === undefined || index <= 0) return;

		updateProductVariantImageKeys([
			imageId,
			...productVariant.imageKeys.filter((currentId) => currentId !== imageId)
		]);
	}

	/** Copies this variant's images to every variant sharing one option value. */
	function applyProductVariantImagesToOptionValue(optionIndex: number, value: string): void {
		productVariants = productVariants.map((currentProductVariant) => {
			const option = currentProductVariant.options[optionIndex];
			return option && option.value.trim() === value.trim()
				? { ...currentProductVariant, imageKeys: [...productVariant.imageKeys] }
				: currentProductVariant;
		});
	}
</script>

<div class="flex flex-col gap-2">
	<div class="flex flex-wrap items-baseline gap-x-2">
		<span class="text-sm font-medium">
			{m['ProductVariantsFeature.ProductVariantsEditorVariantImagePicker.images']()}
		</span>
		<span class="text-xs text-muted-foreground">
			{uploadFiles.length === 0
				? m['ProductVariantsFeature.ProductVariantsEditorVariantImagePicker.uploadFirst']()
				: m['ProductVariantsFeature.ProductVariantsEditorVariantImagePicker.hint']()}
		</span>
	</div>

	{#if uploadFiles.length > 0}
		{#if unassignedProductVariantImages.length > 0}
			<div class="flex flex-wrap gap-2">
				{#each unassignedProductVariantImages as { preview, libraryNumber } (preview.id)}
					<button
						type="button"
						aria-label={m[
							'ProductVariantsFeature.ProductVariantsEditorVariantImagePicker.assignImage'
						]({ number: libraryNumber })}
						{disabled}
						class="relative size-16 shrink-0 overflow-hidden rounded-lg border border-border transition-[border-color,box-shadow] hover:border-foreground/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
						onclick={() => assignProductVariantImage(preview.id)}
					>
						<img src={preview.url} alt="" class="size-full object-cover" />
					</button>
				{/each}
			</div>
		{:else}
			<span class="text-xs text-muted-foreground">
				{m['ProductVariantsFeature.ProductVariantsEditorVariantImagePicker.allImagesApplied']()}
			</span>
		{/if}

		<div class="flex flex-col gap-2">
			<span class="text-sm font-medium">
				{m['ProductVariantsFeature.ProductVariantsEditorVariantImagePicker.appliedImages']()}
			</span>
			{#if appliedProductVariantImages.length === 0}
				<span class="text-xs text-muted-foreground">
					{m['ProductVariantsFeature.ProductVariantsEditorVariantImagePicker.noAppliedImages']()}
				</span>
			{:else}
				<div class="grid w-full max-w-md grid-cols-3 gap-3 sm:grid-cols-4">
					{#each appliedProductVariantImages as preview, index (preview.id)}
						<UploadFilePreviewItem
							{preview}
							{index}
							total={appliedProductVariantImages.length}
							allowMultiple
							onRemove={removeProductVariantImage}
							onMove={moveProductVariantImage}
							onSetCover={setProductVariantCoverImage}
						/>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	{#if productVariant.imageKeys.length > 0 && productVariant.options.some( (option) => option.value.trim() )}
		<div class="flex flex-wrap items-center gap-2">
			<span class="text-xs text-muted-foreground">
				{m['ProductVariantsFeature.ProductVariantsEditorVariantImagePicker.applyToSameValue']()}
			</span>
			{#each productVariant.options as option, optionIndex (optionIndex)}
				{#if option.value.trim()}
					<Button
						type="button"
						variant="outline"
						size="xs"
						{disabled}
						onclick={() => applyProductVariantImagesToOptionValue(optionIndex, option.value)}
					>
						{option.value}
					</Button>
				{/if}
			{/each}
		</div>
	{/if}
</div>
