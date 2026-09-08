<script lang="ts">
	// COMPONENTS
	import AdminUpsellsAddDialogSelectProduct from './admin-upsells-add-dialog-select-product.svelte';
	import AdminUpsellsAddDialogSelectedProduct from './admin-upsells-add-dialog-selected-product.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import NativeDialog from '@/components/ui/native-components/native-dialog/native-dialog.svelte';

	// TRANSLATIONS
	import { m } from '@/lib/paraglide/messages';

	// TYPES
	import type { Doc } from '@convex/_generated/dataModel.js';

	type Product = Doc<'products'>;

	let selectedProduct = $state<Product | null>(null);
</script>

<NativeDialog class="overflow-visible">
	{#snippet trigger({ open })}
		<Button type="button" class="self-start" onclick={open}>
			<span class="icon-[lucide--plus] size-4" data-icon="inline-start"></span>
			{m['AdminUpsellsPage.AdminUpsellsAddDialog.addUpsell']()}
		</Button>
	{/snippet}

	<div class="flex flex-col gap-5 p-6">
		<h2 class="pr-8 text-lg font-semibold">
			{m['AdminUpsellsPage.AdminUpsellsAddDialog.title']()}
		</h2>

		{#if selectedProduct}
			<AdminUpsellsAddDialogSelectedProduct
				product={selectedProduct}
				onChange={() => (selectedProduct = null)}
			/>
		{:else}
			<AdminUpsellsAddDialogSelectProduct onSelect={(product) => (selectedProduct = product)} />
		{/if}
	</div>
</NativeDialog>
