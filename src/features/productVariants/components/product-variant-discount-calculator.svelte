<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field/index.js';
	import { Input } from '@/components/ui/input/index.js';

	// UTILS
	import { hasInvalidCustomPercent } from '@/shared/features/products/utils/hasInvalidCustomPercent.js';
	import { calculateDiscountedPriceInCents } from '@/shared/utils/pricing.js';

	// TYPES
	import type { ProductVariantFormValue } from '@/shared/features/productVariants/types/productVariantTypes.js';

	type Props = {
		productVariants: ProductVariantFormValue[];
		rowIndex: number;
		disabled?: boolean;
	};

	let { productVariants = $bindable(), rowIndex, disabled = false }: Props = $props();

	const componentId = $props.id();
	const customDiscountId = `${componentId}-custom-discount`;
	const customDiscountHelpId = `${componentId}-custom-discount-help`;

	const presetPercentages = [5, 10, 15, 20] as const;
	let customPercent = $state('');

	const regularPriceInCents = $derived(
		productVariants[rowIndex]?.compareAtPriceInCents ?? productVariants[rowIndex]?.priceInCents
	);
	const hasPrice = $derived(
		regularPriceInCents !== undefined &&
			Number.isSafeInteger(regularPriceInCents) &&
			regularPriceInCents > 0
	);
	const customPercentNumber = $derived(Number(customPercent));
	const customPercentIsInvalid = $derived(
		hasInvalidCustomPercent(customPercent, customPercentNumber)
	);
	const canApplyCustomPercent = $derived(
		hasPrice && customPercent !== '' && !customPercentIsInvalid
	);

	function applyProductVariantDiscount(discountPercent: number): void {
		const priceInCents = regularPriceInCents;
		if (priceInCents === undefined) return;

		const discountedPriceInCents = calculateDiscountedPriceInCents(priceInCents, discountPercent);
		if (discountedPriceInCents === null) return;

		productVariants = productVariants.map((productVariant, index) =>
			index === rowIndex
				? {
						...productVariant,
						compareAtPriceInCents: priceInCents,
						priceInCents: discountedPriceInCents
					}
				: productVariant
		);
		customPercent = String(discountPercent);
	}
</script>

<div class="flex flex-col gap-3">
	<div
		class="flex flex-wrap gap-2"
		role="group"
		aria-label={m['ProductVariantsFeature.ProductVariantDiscountCalculator.presets']()}
	>
		{#each presetPercentages as percentage (percentage)}
			<Button
				type="button"
				variant="outline"
				size="sm"
				disabled={disabled || !hasPrice}
				onclick={() => applyProductVariantDiscount(percentage)}
			>
				{percentage}%
			</Button>
		{/each}
	</div>

	<Field
		class="max-w-sm"
		data-disabled={disabled || !hasPrice}
		data-invalid={customPercentIsInvalid}
	>
		<FieldLabel for={customDiscountId}>
			{m['ProductVariantsFeature.ProductVariantDiscountCalculator.customDiscount']()}
		</FieldLabel>
		<div class="flex items-center gap-2">
			<Input
				id={customDiscountId}
				type="number"
				min="5"
				max="95"
				step="5"
				placeholder="25"
				value={customPercent}
				disabled={disabled || !hasPrice}
				aria-invalid={customPercentIsInvalid}
				aria-describedby={customDiscountHelpId}
				oninput={(event) => (customPercent = event.currentTarget.value)}
			/>
			<Button
				type="button"
				variant="secondary"
				disabled={disabled || !canApplyCustomPercent}
				onclick={() => applyProductVariantDiscount(customPercentNumber)}
			>
				{m['ProductVariantsFeature.ProductVariantDiscountCalculator.apply']()}
			</Button>
		</div>
		{#if customPercentIsInvalid}
			<FieldError id={customDiscountHelpId}>
				{m['ProductVariantsFeature.ProductVariantDiscountCalculator.stepError']()}
			</FieldError>
		{:else}
			<FieldDescription id={customDiscountHelpId}>
				{hasPrice
					? m['ProductVariantsFeature.ProductVariantDiscountCalculator.customDiscountDescription']()
					: m['ProductVariantsFeature.ProductVariantDiscountCalculator.enterPriceFirst']()}
			</FieldDescription>
		{/if}
	</Field>
</div>
