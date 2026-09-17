<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Badge } from '@/components/ui/badge/index.js';
	import * as Card from '@/components/ui/card/index.js';
	import AdminEditOrderCancelButton from './admin-edit-order-cancel-button.svelte';
	import AdminEditOrderFulfillmentStatusButton from './admin-edit-order-fulfillment-status-button.svelte';
	import AdminEditOrderRefundButton from './admin-edit-order-refund-button.svelte';
	import OrdersFulfillmentStatusBadge from '@/features/orders/components/orders-fulfillment-status-badge.svelte';
	import OrdersPaymentStatusBadge from '@/features/orders/components/orders-payment-status-badge.svelte';

	// TYPES
	import type { Doc } from '@convex/_generated/dataModel';

	let { order }: { order: Doc<'orders'> } = $props();
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
		<div class="flex flex-wrap gap-2">
			<AdminEditOrderFulfillmentStatusButton {order} />
			<AdminEditOrderCancelButton {order} />
			<AdminEditOrderRefundButton {order} />
		</div>
	</Card.Content>
</Card.Root>
