<script lang="ts">
	// COMPONENTS
	import ManageUpsellsDialogSelectedUpsellItem from './manage-upsells-dialog-selected-upsell-item.svelte';
	import ManageUpsellsDialogSelectProduct from './manage-upsells-dialog-select-product.svelte';
	import UpsellProductSummary from '../upsell-product-summary.svelte';
	import { Button } from '@/components/ui/button/index.js';

	// TRANSLATIONS
	import { m } from '@/lib/paraglide/messages';

	// CONFIG
	import { UPSELLS_CONFIG } from '@/shared/features/upsells/config.js';

	// TYPES
	import type { Doc } from '@convex/_generated/dataModel.js';

	let {
		product,
		onChange,
		upsellProducts = $bindable(),
		showChange = true
	}: {
		product: Doc<'products'>;
		onChange: () => void;
		upsellProducts: Doc<'products'>[];
		showChange?: boolean;
	} = $props();

	const canAddUpsell = $derived(upsellProducts.length < UPSELLS_CONFIG.maxProducts);
	const excludedProductIds = $derived([
		product._id,
		...upsellProducts.map((upsellProduct) => upsellProduct._id)
	]);

	function addUpsell(upsellProduct: Doc<'products'>): void {
		const isUnavailableSelection = !canAddUpsell || excludedProductIds.includes(upsellProduct._id);
		if (isUnavailableSelection) return;
		upsellProducts = [...upsellProducts, upsellProduct];
	}

	function removeUpsell(productId: Doc<'products'>['_id']): void {
		upsellProducts = upsellProducts.filter((upsellProduct) => upsellProduct._id !== productId);
	}
</script>

<div class="flex flex-col gap-5">
	<div class="flex items-center justify-between gap-4">
		<div class="flex min-w-0 items-center gap-3">
			<UpsellProductSummary {product} />
		</div>
		{#if showChange}
			<Button type="button" variant="outline" size="sm" onclick={onChange}>
				{m['UpsellsFeature.ManageUpsellsDialogSelectedProduct.change']()}
			</Button>
		{/if}
	</div>

	{#if canAddUpsell}
		<ManageUpsellsDialogSelectProduct
			label={m['UpsellsFeature.ManageUpsellsDialogSelectedProduct.upsellLabel']()}
			placeholder={m['UpsellsFeature.ManageUpsellsDialogSelectedProduct.upsellSearchPlaceholder']()}
			{excludedProductIds}
			activeOnly
			onSelect={addUpsell}
		/>
	{/if}

	{#if upsellProducts.length > 0}
		<ul class="divide-y rounded-xl border px-3">
			{#each upsellProducts as upsellProduct (upsellProduct._id)}
				<li>
					<ManageUpsellsDialogSelectedUpsellItem
						product={upsellProduct}
						onRemove={() => removeUpsell(upsellProduct._id)}
					/>
				</li>
			{/each}
		</ul>
	{:else}
		<p
			class="rounded-xl border border-destructive bg-destructive/5 p-3 text-sm text-destructive"
			role="alert"
		>
			{m['UpsellsFeature.ManageUpsellsDialogSelectedProduct.minimumUpsells']()}
		</p>
	{/if}
</div>
