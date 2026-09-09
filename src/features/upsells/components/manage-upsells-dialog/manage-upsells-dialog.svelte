<script lang="ts">
	// LIBRARIES
	import { api } from '@convex/_generated/api';
	import { useQuery } from 'convex-svelte';
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import ManageUpsellsDialogForm from './manage-upsells-dialog-form.svelte';
	import ManageUpsellsDialogLoading from './manage-upsells-dialog-loading.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import NativeDialog from '@/components/ui/native-components/native-dialog/native-dialog.svelte';

	// TYPES
	import type { Id } from '@convex/_generated/dataModel.js';

	let { upsellId }: { upsellId?: Id<'products'> } = $props();

	let editQueryEnabled = $state(false);

	// NativeDialog keeps its children mounted after closing. Changing this key on
	// every open recreates the form so draft selections and saving state are reset.
	let formKey = $state(0);

	const editData = useQuery(api.tables.upsells.queries.fetchUpsellForEdit.fetchUpsellForEdit, () =>
		upsellId && editQueryEnabled ? { productId: upsellId } : 'skip'
	);

	function openDialog(open: () => void): void {
		formKey += 1;
		editQueryEnabled = true;
		open();
	}
</script>

<NativeDialog class="overflow-visible">
	{#snippet trigger({ open })}
		{#if upsellId}
			<Button type="button" variant="outline" size="sm" onclick={() => openDialog(open)}>
				<span class="icon-[lucide--pencil]" data-icon="inline-start" aria-hidden="true"></span>
				{m['UpsellsFeature.ManageUpsellsDialog.editUpsells']()}
			</Button>
		{:else}
			<Button type="button" class="self-start" onclick={() => openDialog(open)}>
				<span class="icon-[lucide--plus]" data-icon="inline-start" aria-hidden="true"></span>
				{m['UpsellsFeature.ManageUpsellsDialog.addUpsell']()}
			</Button>
		{/if}
	{/snippet}

	{#snippet children({ close })}
		{#if upsellId && editData.isLoading}
			<ManageUpsellsDialogLoading />
		{:else if upsellId && editData.error}
			<div class="flex flex-col gap-5 p-6">
				<h2 class="pr-8 text-lg font-semibold">
					{m['UpsellsFeature.ManageUpsellsDialog.editTitle']()}
				</h2>
				<p class="text-sm text-destructive" role="alert">
					{m['UpsellsFeature.ManageUpsellsDialog.loadError']()}
				</p>
				<div class="flex justify-end">
					<Button type="button" variant="outline" onclick={close}>
						{m['UpsellsFeature.ManageUpsellsDialog.cancel']()}
					</Button>
				</div>
			</div>
		{:else}
			{#key formKey}
				<ManageUpsellsDialogForm
					initialProduct={editData.data?.product}
					initialUpsells={editData.data?.upsells}
					isEditing={Boolean(upsellId)}
					{close}
				/>
			{/key}
		{/if}
	{/snippet}
</NativeDialog>
