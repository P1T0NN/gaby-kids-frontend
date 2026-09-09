<script lang="ts">
	import { api } from '@convex/_generated/api';
	import { useMutation } from 'convex-svelte';
	import { untrack } from 'svelte';

	import ManageUpsellsDialogSelectProduct from './manage-upsells-dialog-select-product.svelte';
	import ManageUpsellsDialogSelectedProduct from './manage-upsells-dialog-selected-product.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import { Spinner } from '@/components/ui/spinner/index.js';

	import { m } from '@/lib/paraglide/messages';
	import { toastMessage } from '@/utils/toastMessage.js';

	import type { Doc } from '@convex/_generated/dataModel.js';

	type Product = Doc<'products'>;

	let {
		initialProduct,
		initialUpsells = [],
		isEditing,
		close
	}: {
		initialProduct?: Product;
		initialUpsells?: Product[];
		isEditing: boolean;
		close: () => void;
	} = $props();

	let selectedProduct = $state.raw<Product | null>(untrack(() => initialProduct ?? null));
	let upsellProducts = $state.raw<Product[]>(untrack(() => initialUpsells));
	let isSaving = $state(false);
	const hasUpsells = $derived(upsellProducts.length > 0);
	const saveProductUpsells = useMutation(
		api.tables.upsells.mutations.saveProductUpsells.saveProductUpsells
	);

	function resetProduct(): void {
		selectedProduct = null;
		upsellProducts = [];
	}

	async function saveUpsells(): Promise<void> {
		if (!selectedProduct || !hasUpsells || isSaving) return;

		isSaving = true;
		try {
			await saveProductUpsells({
				productId: selectedProduct._id,
				upsellProductIds: upsellProducts.map((product) => product._id)
			});
			toastMessage({
				type: 'success',
				message: isEditing
					? m['UpsellsFeature.ManageUpsellsDialog.upsellsUpdated']()
					: m['UpsellsFeature.ManageUpsellsDialog.upsellsAdded']()
			});
			close();
		} catch (error) {
			toastMessage({
				type: 'error',
				error,
				message: isEditing
					? m['UpsellsFeature.ManageUpsellsDialog.updateError']()
					: m['UpsellsFeature.ManageUpsellsDialog.addError']()
			});
		} finally {
			isSaving = false;
		}
	}
</script>

<div class="flex flex-col gap-5 p-6">
	<h2 class="pr-8 text-lg font-semibold">
		{isEditing
			? m['UpsellsFeature.ManageUpsellsDialog.editTitle']()
			: m['UpsellsFeature.ManageUpsellsDialog.title']()}
	</h2>

	{#if selectedProduct}
		<ManageUpsellsDialogSelectedProduct
			product={selectedProduct}
			bind:upsellProducts
			onChange={resetProduct}
			showChange={!isEditing}
		/>
	{:else}
		<ManageUpsellsDialogSelectProduct onSelect={(product) => (selectedProduct = product)} />
	{/if}

	<div class="flex justify-end gap-2">
		<Button type="button" variant="outline" onclick={close} disabled={isSaving}>
			{m['UpsellsFeature.ManageUpsellsDialog.cancel']()}
		</Button>
		<Button
			type="button"
			onclick={() => void saveUpsells()}
			disabled={!selectedProduct || !hasUpsells || isSaving}
		>
			{#if isSaving}<Spinner data-icon="inline-start" />{/if}
			{isSaving
				? isEditing
					? m['UpsellsFeature.ManageUpsellsDialog.savingUpsells']()
					: m['UpsellsFeature.ManageUpsellsDialog.addingUpsells']()
				: isEditing
					? m['UpsellsFeature.ManageUpsellsDialog.saveUpsells']()
					: m['UpsellsFeature.ManageUpsellsDialog.addUpsells']()}
		</Button>
	</div>
</div>
