<script lang="ts">
	// LIBRARIES
	import { api } from '@convex/_generated/api';
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime';

	// COMPONENTS
	import { Badge } from '@/components/ui/badge/index.js';
	import ButtonLink from '@/components/ui/custom-components/button-link/button-link.svelte';
	import OrdersFulfillmentStatusBadge from '@/features/orders/components/orders-fulfillment-status-badge.svelte';
	import OrdersPaymentStatusBadge from '@/features/orders/components/orders-payment-status-badge.svelte';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// UTILS
	import { formatDateTime } from '@/shared/utils/date.js';
	import { formatPrice } from '@/shared/features/cart/utils/formatPrice.js';

	// TYPES
	import type { FunctionReturnType } from 'convex/server';

	type Order = FunctionReturnType<
		typeof api.tables.orders.queries.fetchMyOrders.fetchMyOrders
	>['items'][number];

	let { order }: { order: Order } = $props();
</script>

<article
	class="grid gap-5 border-b py-6 first:pt-0 last:border-b-0 last:pb-0 sm:grid-cols-[1fr_auto] sm:items-center"
>
	<div class="min-w-0 space-y-3">
		<div class="flex flex-wrap items-center gap-2">
			<h2 class="font-mono text-lg font-semibold tracking-wide">#{order.code}</h2>
			{#if order.cancelledAt}
				<Badge variant="destructive">{m['MyOrdersPage.MyOrdersItem.cancelled']()}</Badge>
			{:else}
				<OrdersFulfillmentStatusBadge status={order.fulfillmentStatus} />
			{/if}
			<OrdersPaymentStatusBadge status={order.paymentStatus} />
		</div>
		<div class="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
			<span>{formatDateTime(order._creationTime, getLocale())}</span>
			<span>
				{order.fulfillmentMethod === 'delivery'
					? m['MyOrdersPage.MyOrdersItem.delivery']()
					: m['MyOrdersPage.MyOrdersItem.pickup']()}
			</span>
			<strong class="font-medium text-foreground tabular-nums"
				>{formatPrice(order.totalInCents)}</strong
			>
		</div>
	</div>

	<ButtonLink href={UNPROTECTED_PAGE_ENDPOINTS.MY_ORDER(order.code)} variant="outline">
		{m['MyOrdersPage.MyOrdersItem.viewOrder']()}
		<span class="icon-[lucide--arrow-right] size-4" aria-hidden="true"></span>
	</ButtonLink>
</article>
