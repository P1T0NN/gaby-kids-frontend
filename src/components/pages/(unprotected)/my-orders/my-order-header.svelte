<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Badge } from '@/components/ui/badge/index.js';
	import ButtonLink from '@/components/ui/custom-components/button-link/button-link.svelte';
	import OrdersFulfillmentStatusBadge from '@/features/orders/components/orders-fulfillment-status-badge.svelte';
	import OrdersPaymentStatusBadge from '@/features/orders/components/orders-payment-status-badge.svelte';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// TYPES
	import type { Doc } from '@convex/_generated/dataModel.js';

	type Order = Pick<Doc<'orders'>, 'code' | 'paymentStatus' | 'fulfillmentStatus' | 'cancelledAt'>;

	let { order }: { order: Order } = $props();
</script>

<header class="flex flex-col gap-5 border-b pb-7">
	<ButtonLink href={UNPROTECTED_PAGE_ENDPOINTS.MY_ORDERS} variant="link" class="w-fit px-0 text-muted-foreground">
		<span class="icon-[lucide--arrow-left] size-4" aria-hidden="true"></span>
		{m['MyOrderPage.MyOrderHeader.back']()}
	</ButtonLink>
	<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
		<div class="space-y-2">
			<p class="text-sm font-medium text-primary">{m['MyOrderPage.MyOrderHeader.eyebrow']()}</p>
			<h1 class="font-mono text-3xl font-semibold tracking-wide sm:text-4xl">#{order.code}</h1>
		</div>
		<div class="flex flex-wrap gap-2">
			{#if order.cancelledAt}
				<Badge variant="destructive">{m['MyOrderPage.MyOrderHeader.cancelled']()}</Badge>
			{:else}
				<OrdersFulfillmentStatusBadge status={order.fulfillmentStatus} />
			{/if}
			<OrdersPaymentStatusBadge status={order.paymentStatus} />
		</div>
	</div>
</header>
