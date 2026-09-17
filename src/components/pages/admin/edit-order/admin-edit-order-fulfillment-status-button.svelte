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

	type FulfillmentAction = 'fulfill' | 'unfulfill';

	let { order }: { order: Doc<'orders'> } = $props();

	let selectedAction = $state<FulfillmentAction | null>(null);
	let pending = $state(false);

	const canFulfillOrder = $derived(
		order.fulfillmentStatus === 'unfulfilled' &&
			order.paymentStatus === 'paid' &&
			order.cancelledAt === undefined
	);
	const canUnfulfillOrder = $derived(order.fulfillmentStatus === 'fulfilled');

	const updateOrder = useMutation(api.tables.orders.mutations.updateOrderAdmin.updateOrderAdmin);

	function openAction(action: FulfillmentAction, open: () => void): void {
		selectedAction = action;
		open();
	}

	async function updateFulfillment(
		close: () => void,
		action: 'fulfill' | 'unfulfill'
	): Promise<void> {
		if (pending) return;

		pending = true;
		try {
			await updateOrder({ id: order._id, action });
			toastMessage({
				type: 'success',
				message: m['AdminEditOrderPage.AdminEditOrderFulfillmentStatusButton.updated']()
			});
			close();
		} catch (error) {
			toastMessage({
				type: 'error',
				error,
				message: m['AdminEditOrderPage.AdminEditOrderFulfillmentStatusButton.updateError']()
			});
		} finally {
			pending = false;
			selectedAction = null;
		}
	}
</script>

{#if canFulfillOrder || canUnfulfillOrder}
	<NativeDialog>
		{#snippet trigger({ open })}
			<div class="flex flex-wrap gap-2">
				{#if canFulfillOrder}
					<Button
						type="button"
						size="sm"
						onclick={() => openAction('fulfill', open)}
						disabled={pending}
					>
						<span class="icon-[lucide--check] size-4" aria-hidden="true"></span>
						{m['AdminEditOrderPage.AdminEditOrderFulfillmentStatusButton.markFulfilled']()}
					</Button>
				{:else}
					<Button
						type="button"
						variant="outline"
						size="sm"
						onclick={() => openAction('unfulfill', open)}
						disabled={pending}
					>
						<span class="icon-[lucide--undo-2] size-4" aria-hidden="true"></span>
						{m['AdminEditOrderPage.AdminEditOrderFulfillmentStatusButton.markUnfulfilled']()}
					</Button>
				{/if}
			</div>
		{/snippet}

		{#snippet children({ close })}
			<div class="flex flex-col gap-5 p-6">
				<div class="flex flex-col gap-1.5">
					<h2 class="text-lg font-semibold">
						{m['AdminEditOrderPage.AdminEditOrderFulfillmentStatusButton.confirmationTitle']()}
					</h2>
					{#if selectedAction === 'fulfill'}
						<p class="text-sm text-muted-foreground">
							{m['AdminEditOrderPage.AdminEditOrderFulfillmentStatusButton.fulfillConfirmation']()}
						</p>
					{:else if selectedAction === 'unfulfill'}
						<p class="text-sm text-muted-foreground">
							{m[
								'AdminEditOrderPage.AdminEditOrderFulfillmentStatusButton.unfulfillConfirmation'
							]()}
						</p>
					{/if}
				</div>

				<div class="flex justify-end gap-2">
					<Button type="button" variant="outline" size="sm" onclick={close} disabled={pending}>
						{m['AdminEditOrderPage.AdminEditOrderFulfillmentStatusButton.keepCurrentStatus']()}
					</Button>
					<Button
						type="button"
						size="sm"
						onclick={() => {
							if (selectedAction !== null) void updateFulfillment(close, selectedAction);
						}}
						disabled={pending || selectedAction === null}
					>
						{#if pending}<Spinner data-icon="inline-start" />{/if}
						{pending
							? m['AdminEditOrderPage.AdminEditOrderFulfillmentStatusButton.processing']()
							: selectedAction === 'fulfill'
								? m['AdminEditOrderPage.AdminEditOrderFulfillmentStatusButton.markFulfilled']()
								: m['AdminEditOrderPage.AdminEditOrderFulfillmentStatusButton.markUnfulfilled']()}
					</Button>
				</div>
			</div>
		{/snippet}
	</NativeDialog>
{/if}
