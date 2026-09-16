<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field/index.js';
	import { Input } from '@/components/ui/input/index.js';
	import { m } from '@/lib/paraglide/messages';

	// UTILS
	import { hasInvalidCustomPercent } from '@/shared/features/products/utils/hasInvalidCustomPercent.js';
	import { calculateDiscountedPriceInCents, priceInCents } from '@/shared/utils/pricing.js';

	// TYPES
	import type { CustomFieldContext } from '@/components/ui/custom-components/form/formTypes.js';

	type Props = Pick<CustomFieldContext, 'disabled' | 'getValue' | 'setValue'>;

	let { disabled, getValue, setValue }: Props = $props();
	let customPercent = $state('');

	const presetPercentages = [5, 10, 15, 20] as const;
	const regularPriceInCents = $derived(priceInCents(String(getValue('priceInCents') ?? '')));
	const hasPrice = $derived(Number.isSafeInteger(regularPriceInCents) && regularPriceInCents > 0);
	const customPercentNumber = $derived(Number(customPercent));
	const customPercentIsInvalid = $derived(
		hasInvalidCustomPercent(customPercent, customPercentNumber)
	);

	const canApplyCustomPercent = $derived(
		hasPrice && customPercent !== '' && !customPercentIsInvalid
	);

	function applyDiscount(discountPercent: number): void {
		const discountedPriceInCents = calculateDiscountedPriceInCents(
			regularPriceInCents,
			discountPercent
		);
		if (discountedPriceInCents === null) return;

		customPercent = String(discountPercent);
		setValue('compareAtPriceInCents', discountedPriceInCents / 100);
	}
</script>

<div class="flex flex-col gap-3">
	<div class="flex flex-wrap gap-2" role="group" aria-label={m['AddProductPage.discountPresets']()}>
		{#each presetPercentages as percentage (percentage)}
			<Button
				type="button"
				variant="outline"
				size="sm"
				disabled={disabled || !hasPrice}
				onclick={() => applyDiscount(percentage)}
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
		<FieldLabel for="customDiscountPercent">{m['AddProductPage.customDiscount']()}</FieldLabel>
		<div class="flex items-center gap-2">
			<Input
				id="customDiscountPercent"
				type="number"
				min="5"
				max="95"
				step="5"
				placeholder="25"
				value={customPercent}
				disabled={disabled || !hasPrice}
				aria-invalid={customPercentIsInvalid}
				aria-describedby="customDiscountPercent-help"
				oninput={(event) => (customPercent = event.currentTarget.value)}
			/>
			<Button
				type="button"
				variant="secondary"
				disabled={disabled || !canApplyCustomPercent}
				onclick={() => applyDiscount(customPercentNumber)}
			>
				{m['AddProductPage.applyDiscount']()}
			</Button>
		</div>
		{#if customPercentIsInvalid}
			<FieldError id="customDiscountPercent-help">
				{m['AddProductPage.discountStepError']()}
			</FieldError>
		{:else}
			<FieldDescription id="customDiscountPercent-help">
				{hasPrice
					? m['AddProductPage.customDiscountDescription']()
					: m['AddProductPage.enterPriceFirst']()}
			</FieldDescription>
		{/if}
	</Field>
</div>
