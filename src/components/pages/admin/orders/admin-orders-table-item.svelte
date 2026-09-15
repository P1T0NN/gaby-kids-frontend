<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime';

	// COMPONENTS
	import { Badge } from '@/components/ui/badge/index.js';
	import Link from '@/components/ui/custom-components/link/link.svelte';
	import NativePopover from '@/components/ui/native-components/native-popover/native-popover.svelte';
	import { TableCell } from '@/components/ui/table/index.js';
	import OrdersFulfillmentStatusBadge from '@/features/orders/components/orders-fulfillment-status-badge.svelte';
	import OrdersPaymentStatusBadge from '@/features/orders/components/orders-payment-status-badge.svelte';

	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// UTILS
	import { formatDateTime } from '@/shared/utils/date.js';
	import { formatPrice } from '@/shared/utils/pricing.js';

	// TYPES
	import type { Doc } from '@convex/_generated/dataModel';

	type Order = Doc<'orders'>;

	let { order }: { order: Order } = $props();
	
	const reference = $derived(order._id.slice(-8).toUpperCase());
</script>

{#snippet actionsTrigger()}
	<span class="icon-[lucide--ellipsis] size-4" aria-hidden="true"></span>
{/snippet}

<TableCell>
	<div class="flex min-w-0 flex-col gap-0.5">
		<span class="font-mono text-sm font-medium">#{reference}</span>
		<span class="text-xs text-muted-foreground">
			{order.fulfillmentMethod === 'delivery'
				? m['AdminOrdersPage.AdminOrdersTableItem.delivery']()
				: m['AdminOrdersPage.AdminOrdersTableItem.pickup']()}
		</span>
	</div>
</TableCell>
<TableCell>
	<div class="flex min-w-0 flex-col gap-0.5">
		<span class="truncate font-medium">{order.firstName} {order.lastName}</span>
		<span class="truncate text-xs text-muted-foreground">{order.email}</span>
	</div>
</TableCell>
<TableCell class="font-medium tabular-nums">{formatPrice(order.totalInCents)}</TableCell>
<TableCell>
	<OrdersPaymentStatusBadge status={order.paymentStatus} />
</TableCell>
<TableCell>
	{#if order.cancelledAt}
		<Badge variant="destructive">{m['AdminOrdersPage.AdminOrdersTableItem.cancelled']()}</Badge>
	{:else}
		<OrdersFulfillmentStatusBadge status={order.fulfillmentStatus} />
	{/if}
</TableCell>
<TableCell class="hidden whitespace-nowrap text-muted-foreground lg:table-cell">
	{formatDateTime(order._creationTime, getLocale())}
</TableCell>
<TableCell class="text-right">
	<NativePopover
		id={`order-actions-${order._id}`}
		trigger={actionsTrigger}
		triggerLabel={m['AdminOrdersPage.AdminOrdersTableItem.openOrderActions']({ reference })}
		triggerClass="size-8 justify-center hover:bg-muted [&_svg]:size-4"
		class="min-w-44"
	>
		<Link
			href={ADMIN_PAGE_ENDPOINTS.EDIT_ORDER(order._id)}
			class="flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
		>
			<span class="icon-[lucide--pencil] size-4" aria-hidden="true"></span>
			{m['AdminOrdersPage.AdminOrdersTableItem.manageOrder']()}
		</Link>
	</NativePopover>
</TableCell>
