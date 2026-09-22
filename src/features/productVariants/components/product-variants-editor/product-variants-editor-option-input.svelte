<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { Input } from '@/components/ui/input/index.js';

	// TYPES
	import type { ProductVariantFormValue } from '@/shared/features/productVariants/types/productVariantTypes.js';

	type Props = {
		optionName: string;
		optionIndex: number;
		productVariantOptionNames: string[];
		productVariants: ProductVariantFormValue[];
		disabled?: boolean;
		/** Submit-time schema error for this option name; empty until a submit fails. */
		error?: string;
	};

	let {
		optionName,
		optionIndex,
		productVariantOptionNames = $bindable(),
		productVariants = $bindable(),
		disabled = false,
		error
	}: Props = $props();

	function renameProductVariantOption(name: string): void {
		productVariantOptionNames = productVariantOptionNames.map((currentName, currentIndex) =>
			currentIndex === optionIndex ? name : currentName
		);
		productVariants = productVariants.map((productVariant) => ({
			...productVariant,
			options: productVariant.options.map((option, currentIndex) =>
				currentIndex === optionIndex ? { ...option, name } : option
			)
		}));
	}

	function removeProductVariantOption(): void {
		productVariantOptionNames = productVariantOptionNames.filter(
			(_, currentIndex) => currentIndex !== optionIndex
		);
		productVariants = productVariants.map((productVariant) => ({
			...productVariant,
			options: productVariant.options.filter((_, currentIndex) => currentIndex !== optionIndex)
		}));
	}
</script>

<div class="flex w-full flex-col gap-1">
	<div class="flex w-full items-center gap-1">
		<Input
			value={optionName}
			placeholder={m[
				'ProductVariantsFeature.ProductVariantsEditorOptionInput.optionNamePlaceholder'
			]({
				number: optionIndex + 1
			})}
			aria-label={m['ProductVariantsFeature.ProductVariantsEditorOptionInput.optionNameLabel']({
				number: optionIndex + 1
			})}
			aria-invalid={error ? true : undefined}
			{disabled}
			class="h-9 max-w-72 flex-1"
			oninput={(event) => renameProductVariantOption(event.currentTarget.value)}
		/>
		<Button
			type="button"
			variant="ghost"
			size="icon-sm"
			class="text-muted-foreground hover:text-destructive"
			aria-label={m['ProductVariantsFeature.ProductVariantsEditorOptionInput.removeOption']()}
			{disabled}
			onclick={removeProductVariantOption}
		>
			<span class="icon-[lucide--x] size-4" aria-hidden="true"></span>
		</Button>
	</div>
	{#if error}
		<p class="text-xs text-destructive">{error}</p>
	{/if}
</div>
