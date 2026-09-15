<script lang="ts">
	// LIBRARIES
	import { useAction } from 'convex-svelte';
	import { m } from '@/lib/paraglide/messages';
	import { api } from '@convex/_generated/api';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import NativeDialog from '@/components/ui/native-components/native-dialog/native-dialog.svelte';
	import { Spinner } from '@/components/ui/spinner/index.js';

	// UTILS
	import { toastMessage } from '@/utils/toastMessage.js';

	// TYPES
	import type { Doc } from '@convex/_generated/dataModel';

	let { order }: { order: Doc<'orders'> } = $props();

	let pending = $state(false);

	const refundOrder = useAction(api.stripe.actions.refundOrder.refundOrder);

	async function handleRefundOrder(close: () => void): Promise<void> {
		if (pending) return;

		pending = true;
		try {
			await refundOrder({ id: order._id });
			toastMessage({
				type: 'success',
				message: m['AdminEditOrderPage.AdminEditOrderRefundButton.refundRequested']()
			});
			close();
		} catch (error) {
			toastMessage({
				type: 'error',
				error,
				message: m['AdminEditOrderPage.AdminEditOrderRefundButton.refundError']()
			});
		} finally {
			pending = false;
		}
	}
</script>

<NativeDialog>
	{#snippet trigger({ open })}
		<Button
			type="button"
			variant="destructive"
			size="sm"
			onclick={open}
			disabled={pending || order.paymentStatus !== 'paid'}
		>
			<span class="icon-[lucide--receipt] size-4" aria-hidden="true"></span>
			{m['AdminEditOrderPage.AdminEditOrderRefundButton.refundOrder']()}
		</Button>
	{/snippet}

	{#snippet children({ close })}
		<div class="flex flex-col gap-5 p-6">
			<div class="flex flex-col gap-1.5">
				<h2 class="text-lg font-semibold">
					{m['AdminEditOrderPage.AdminEditOrderRefundButton.confirmationTitle']()}
				</h2>
				<p class="text-sm text-muted-foreground">
					{m['AdminEditOrderPage.AdminEditOrderRefundButton.refundConfirmation']()}
				</p>
			</div>

			<div class="flex justify-end gap-2">
				<Button type="button" variant="outline" size="sm" onclick={close} disabled={pending}>
					{m['AdminEditOrderPage.AdminEditOrderRefundButton.keepCurrentStatus']()}
				</Button>
				<Button
					type="button"
					variant="destructive"
					size="sm"
					onclick={() => void handleRefundOrder(close)}
					disabled={pending}
				>
					{#if pending}<Spinner data-icon="inline-start" />{/if}
					{pending
						? m['AdminEditOrderPage.AdminEditOrderRefundButton.processing']()
						: m['AdminEditOrderPage.AdminEditOrderRefundButton.refundOrder']()}
				</Button>
			</div>
		</div>
	{/snippet}
</NativeDialog>
