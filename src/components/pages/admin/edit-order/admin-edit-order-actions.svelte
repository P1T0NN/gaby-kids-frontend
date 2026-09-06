<script lang="ts">
	// CONVEX
	import { api } from '@convex/_generated/api';

	// LIBRARIES
	import { useMutation } from 'convex-svelte';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { Badge } from '@/components/ui/badge/index.js';
	import * as Card from '@/components/ui/card/index.js';
	import NativeDialog from '@/components/ui/native-components/native-dialog/native-dialog.svelte';
	import { Spinner } from '@/components/ui/spinner/index.js';
	import OrdersFulfillmentStatusBadge from '@/features/orders/components/orders-fulfillment-status-badge.svelte';
	import OrdersPaymentStatusBadge from '@/features/orders/components/orders-payment-status-badge.svelte';
	import { m } from '@/lib/paraglide/messages';

	// UTILS
	import { toastMessage } from '@/utils/toastMessage.js';

	// TYPES
	import type { Doc } from '@convex/_generated/dataModel';

	type AdminOrderAction = 'fulfill' | 'unfulfill' | 'cancel' | 'restore' | 'request_refund';

	let { order }: { order: Doc<'orders'> } = $props();
	let selectedAction = $state<AdminOrderAction | null>(null);
	let pendingAction = $state<AdminOrderAction | null>(null);

	const updateOrder = useMutation(api.tables.orders.mutations.updateOrderAdmin.updateOrderAdmin);

	function chooseAction(action: AdminOrderAction, open: () => void): void {
		selectedAction = action;
		open();
	}

	async function confirmAction(close: () => void): Promise<void> {
		const action = selectedAction;
		if (!action || pendingAction !== null) return;

		pendingAction = action;
		try {
			await updateOrder({ id: order._id, action });
			toastMessage({
				type: 'success',
				message: m['AdminEditOrderPage.AdminEditOrderActions.updated']()
			});
			close();
		} catch (error) {
			toastMessage({
				type: 'error',
				error,
				message: m['AdminEditOrderPage.AdminEditOrderActions.updateError']()
			});
		} finally {
			pendingAction = null;
			selectedAction = null;
		}
	}
</script>

<Card.Root size="sm" class="w-full">
	<Card.Header class="flex flex-wrap items-start justify-between gap-3">
		<div class="min-w-0">
			<Card.Title>{m['AdminEditOrderPage.AdminEditOrderActions.management']()}</Card.Title>
			<Card.Description>
				{m['AdminEditOrderPage.AdminEditOrderActions.managementDescription']()}
			</Card.Description>
		</div>

		<div class="flex flex-wrap items-center gap-2">
			<span class="text-sm font-medium">
				{m['AdminEditOrderPage.AdminEditOrderActions.paymentStatus']()}
			</span>
			<OrdersPaymentStatusBadge status={order.paymentStatus} />
			<span class="text-sm font-medium">
				{m['AdminEditOrderPage.AdminEditOrderActions.fulfillmentStatus']()}
			</span>
			<OrdersFulfillmentStatusBadge status={order.fulfillmentStatus} />
			{#if order.cancelledAt !== undefined}
				<Badge variant="destructive">
					{m['AdminEditOrderPage.AdminEditOrderActions.cancelled']()}
				</Badge>
			{/if}
		</div>
	</Card.Header>

	<Card.Content class="pt-0">
		<NativeDialog>
			{#snippet trigger({ open })}
				<div class="flex flex-wrap gap-2">
					{#if order.fulfillmentStatus === 'unfulfilled' && order.paymentStatus === 'paid' && order.cancelledAt === undefined}
						<Button
							type="button"
							size="sm"
							onclick={() => chooseAction('fulfill', open)}
							disabled={pendingAction !== null}
						>
							<span class="icon-[lucide--check] size-4" aria-hidden="true"></span>
							{m['AdminEditOrderPage.AdminEditOrderActions.markFulfilled']()}
						</Button>
					{:else if order.fulfillmentStatus === 'fulfilled'}
						<Button
							type="button"
							variant="outline"
							size="sm"
							onclick={() => chooseAction('unfulfill', open)}
							disabled={pendingAction !== null}
						>
							<span class="icon-[lucide--undo-2] size-4" aria-hidden="true"></span>
							{m['AdminEditOrderPage.AdminEditOrderActions.markUnfulfilled']()}
						</Button>
					{/if}

					{#if order.cancelledAt === undefined}
						<Button
							type="button"
							variant="destructive"
							size="sm"
							onclick={() => chooseAction('cancel', open)}
							disabled={pendingAction !== null}
						>
							<span class="icon-[lucide--ban] size-4" aria-hidden="true"></span>
							{m['AdminEditOrderPage.AdminEditOrderActions.cancelOrder']()}
						</Button>
					{:else}
						<Button
							type="button"
							variant="outline"
							size="sm"
							onclick={() => chooseAction('restore', open)}
							disabled={pendingAction !== null}
						>
							<span class="icon-[lucide--rotate-ccw] size-4" aria-hidden="true"></span>
							{m['AdminEditOrderPage.AdminEditOrderActions.restoreOrder']()}
						</Button>
					{/if}

					<Button type="button" variant="destructive" size="sm" disabled>
						<span class="icon-[lucide--receipt] size-4" aria-hidden="true"></span>
						{m['AdminEditOrderPage.AdminEditOrderActions.refundOrder']()}
					</Button>
				</div>
			{/snippet}

			{#snippet children({ close })}
				<div class="flex flex-col gap-5 p-6">
					<div class="flex flex-col gap-1.5">
						<h2 class="text-lg font-semibold">
							{m['AdminEditOrderPage.AdminEditOrderActions.confirmationTitle']()}
						</h2>
						{#if selectedAction === 'fulfill'}
							<p class="text-sm text-muted-foreground">
								{m['AdminEditOrderPage.AdminEditOrderActions.fulfillConfirmation']()}
							</p>
						{:else if selectedAction === 'unfulfill'}
							<p class="text-sm text-muted-foreground">
								{m['AdminEditOrderPage.AdminEditOrderActions.unfulfillConfirmation']()}
							</p>
						{:else if selectedAction === 'cancel'}
							<p class="text-sm text-muted-foreground">
								{m['AdminEditOrderPage.AdminEditOrderActions.cancelConfirmation']()}
							</p>
							<p role="alert" class="text-lg font-bold text-destructive">
								{m['AdminEditOrderPage.AdminEditOrderActions.cancelNoRefund']()}
							</p>
							<p class="text-sm text-muted-foreground">
								{m['AdminEditOrderPage.AdminEditOrderActions.cancelRefundInstruction']()}
							</p>
						{:else if selectedAction === 'restore'}
							<p class="text-sm text-muted-foreground">
								{m['AdminEditOrderPage.AdminEditOrderActions.restoreConfirmation']()}
							</p>
						{:else if selectedAction === 'request_refund'}
							<p class="text-sm text-muted-foreground">
								{m['AdminEditOrderPage.AdminEditOrderActions.refundConfirmation']()}
							</p>
						{/if}
					</div>

					<div class="flex justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onclick={close}
							disabled={pendingAction !== null}
						>
							{m['AdminEditOrderPage.AdminEditOrderActions.keepCurrentStatus']()}
						</Button>
						<Button
							type="button"
							variant={selectedAction === 'cancel' || selectedAction === 'request_refund'
								? 'destructive'
								: 'default'}
							size="sm"
							onclick={() => void confirmAction(close)}
							disabled={pendingAction !== null}
						>
							{#if pendingAction === selectedAction}<Spinner data-icon="inline-start" />{/if}
							{pendingAction === selectedAction
								? m['AdminEditOrderPage.AdminEditOrderActions.processing']()
								: selectedAction === 'fulfill'
									? m['AdminEditOrderPage.AdminEditOrderActions.markFulfilled']()
									: selectedAction === 'unfulfill'
										? m['AdminEditOrderPage.AdminEditOrderActions.markUnfulfilled']()
										: selectedAction === 'cancel'
											? m['AdminEditOrderPage.AdminEditOrderActions.cancelOrder']()
											: selectedAction === 'restore'
												? m['AdminEditOrderPage.AdminEditOrderActions.restoreOrder']()
												: m['AdminEditOrderPage.AdminEditOrderActions.refundOrder']()}
						</Button>
					</div>
				</div>
			{/snippet}
		</NativeDialog>
	</Card.Content>
</Card.Root>
