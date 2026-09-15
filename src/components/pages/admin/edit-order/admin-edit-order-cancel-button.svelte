<script lang="ts">
	// CONVEX
	import { api } from '@convex/_generated/api';

	// LIBRARIES
	import { useMutation } from 'convex-svelte';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import NativeDialog from '@/components/ui/native-components/native-dialog/native-dialog.svelte';
	import { Spinner } from '@/components/ui/spinner/index.js';
	import { m } from '@/lib/paraglide/messages';

	// UTILS
	import { toastMessage } from '@/utils/toastMessage.js';

	// TYPES
	import type { Doc } from '@convex/_generated/dataModel';

	let { order }: { order: Doc<'orders'> } = $props();
	let pending = $state(false);

	const updateOrder = useMutation(api.tables.orders.mutations.updateOrderAdmin.updateOrderAdmin);

	async function handleCancelOrder(close: () => void): Promise<void> {
		if (pending) return;

		pending = true;
		try {
			await updateOrder({ id: order._id, action: 'cancel' });
			toastMessage({
				type: 'success',
				message: m['AdminEditOrderPage.AdminEditOrderCancelButton.updated']()
			});
			close();
		} catch (error) {
			toastMessage({
				type: 'error',
				error,
				message: m['AdminEditOrderPage.AdminEditOrderCancelButton.updateError']()
			});
		} finally {
			pending = false;
		}
	}
</script>

{#if order.cancelledAt === undefined}
	<NativeDialog>
		{#snippet trigger({ open })}
			<Button type="button" variant="destructive" size="sm" onclick={open} disabled={pending}>
				<span class="icon-[lucide--ban] size-4" aria-hidden="true"></span>
				{m['AdminEditOrderPage.AdminEditOrderCancelButton.cancelOrder']()}
			</Button>
		{/snippet}

		{#snippet children({ close })}
			<div class="flex flex-col gap-5 p-6">
				<div class="flex flex-col gap-1.5">
					<h2 class="text-lg font-semibold">
						{m['AdminEditOrderPage.AdminEditOrderCancelButton.confirmationTitle']()}
					</h2>
					<p class="text-sm text-muted-foreground">
						{m['AdminEditOrderPage.AdminEditOrderCancelButton.cancelConfirmation']()}
					</p>
					<p role="alert" class="text-lg font-bold text-destructive">
						{m['AdminEditOrderPage.AdminEditOrderCancelButton.cancelNoRefund']()}
					</p>
					<p class="text-sm text-muted-foreground">
						{m['AdminEditOrderPage.AdminEditOrderCancelButton.cancelRefundInstruction']()}
					</p>
				</div>

				<div class="flex justify-end gap-2">
					<Button type="button" variant="outline" size="sm" onclick={close} disabled={pending}>
						{m['AdminEditOrderPage.AdminEditOrderCancelButton.keepCurrentStatus']()}
					</Button>
					<Button
						type="button"
						variant="destructive"
						size="sm"
						onclick={() => void handleCancelOrder(close)}
						disabled={pending}
					>
						{#if pending}<Spinner data-icon="inline-start" />{/if}
						{pending
							? m['AdminEditOrderPage.AdminEditOrderCancelButton.processing']()
							: m['AdminEditOrderPage.AdminEditOrderCancelButton.cancelOrder']()}
					</Button>
				</div>
			</div>
		{/snippet}
	</NativeDialog>
{/if}
