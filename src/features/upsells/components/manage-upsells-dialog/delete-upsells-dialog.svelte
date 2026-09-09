<script lang="ts">
	// CONVEX
	import { api } from '@convex/_generated/api';

	// LIBRARIES
	import { useMutation } from 'convex-svelte';
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import NativeDialog from '@/components/ui/native-components/native-dialog/native-dialog.svelte';
	import { Spinner } from '@/components/ui/spinner/index.js';

	// UTILS
	import { toastMessage } from '@/utils/toastMessage.js';

	// TYPES
	import type { Id } from '@convex/_generated/dataModel.js';

	let { productId, productName }: { productId: Id<'products'>; productName: string } = $props();

	let isDeleting = $state(false);
	const saveProductUpsells = useMutation(
		api.tables.upsells.mutations.saveProductUpsells.saveProductUpsells
	);

	async function deleteUpsells(close: () => void): Promise<void> {
		if (isDeleting) return;

		isDeleting = true;
		try {
			await saveProductUpsells({ productId, upsellProductIds: [] });
			toastMessage({
				type: 'success',
				message: m['UpsellsFeature.DeleteUpsellsDialog.upsellsDeleted']()
			});
			close();
		} catch (error) {
			toastMessage({
				type: 'error',
				error,
				message: m['UpsellsFeature.DeleteUpsellsDialog.deleteError']()
			});
		} finally {
			isDeleting = false;
		}
	}
</script>

<NativeDialog>
	{#snippet trigger({ open })}
		<Button type="button" variant="destructive" size="sm" onclick={open}>
			<span class="icon-[lucide--trash-2]" data-icon="inline-start" aria-hidden="true"></span>
			{m['UpsellsFeature.DeleteUpsellsDialog.deleteUpsell']()}
		</Button>
	{/snippet}

	{#snippet children({ close })}
		<div class="flex flex-col gap-5 p-6">
			<div class="flex flex-col gap-2">
				<h2 class="pr-8 text-lg font-semibold">
					{m['UpsellsFeature.DeleteUpsellsDialog.title']()}
				</h2>
				<p class="text-sm text-muted-foreground">
					{m['UpsellsFeature.DeleteUpsellsDialog.description']({ name: productName })}
				</p>
				<p class="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm font-medium">
					{m['UpsellsFeature.DeleteUpsellsDialog.editInstead']()}
				</p>
			</div>

			<div class="flex justify-end gap-2">
				<Button type="button" variant="outline" onclick={close} disabled={isDeleting}>
					{m['UpsellsFeature.DeleteUpsellsDialog.cancel']()}
				</Button>
				<Button
					type="button"
					variant="destructive"
					onclick={() => void deleteUpsells(close)}
					disabled={isDeleting}
				>
					{#if isDeleting}<Spinner data-icon="inline-start" />{/if}
					{isDeleting
						? m['UpsellsFeature.DeleteUpsellsDialog.deleting']()
						: m['UpsellsFeature.DeleteUpsellsDialog.delete']()}
				</Button>
			</div>
		</div>
	{/snippet}
</NativeDialog>
