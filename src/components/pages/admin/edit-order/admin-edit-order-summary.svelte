<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime';

	// COMPONENTS
	import * as Card from '@/components/ui/card/index.js';
	import OrderLineItems from '@/features/orders/components/order-line-items.svelte';
	import OrderShippingAddress from '@/features/orders/components/order-shipping-address.svelte';

	// UTILS
	import { formatDateTime } from '@/shared/utils/date.js';

	// TYPES
	import type { Doc } from '@convex/_generated/dataModel';

	type Props = {
		order: Doc<'orders'>;
		items: Doc<'orderItems'>[];
	};

	let { order, items }: Props = $props();
</script>

<div class="flex min-w-0 flex-col gap-6">
	<Card.Root>
		<Card.Header>
			<Card.Title>{m['AdminEditOrderPage.AdminEditOrderSummary.customer']()}</Card.Title>
			<Card.Description>{formatDateTime(order._creationTime, getLocale())}</Card.Description>
		</Card.Header>

		<Card.Content class="grid gap-5 sm:grid-cols-2">
			<div>
				<p class="text-xs text-muted-foreground">
					{m['AdminEditOrderPage.AdminEditOrderSummary.name']()}
				</p>
				<p class="font-medium">{order.firstName} {order.lastName}</p>
			</div>

			<div>
				<p class="text-xs text-muted-foreground">
					{m['AdminEditOrderPage.AdminEditOrderSummary.email']()}
				</p>
				<p class="font-medium break-all">{order.email}</p>
			</div>

			<div>
				<p class="text-xs text-muted-foreground">
					{m['AdminEditOrderPage.AdminEditOrderSummary.phone']()}
				</p>
				<p class="font-medium">{order.phone}</p>
			</div>

			<div>
				<p class="text-xs text-muted-foreground">
					{m['AdminEditOrderPage.AdminEditOrderSummary.fulfillment']()}
				</p>
				<p class="font-medium">
					{order.fulfillmentMethod === 'delivery'
						? m['AdminOrdersPage.AdminOrdersTableItem.delivery']()
						: m['AdminOrdersPage.AdminOrdersTableItem.pickup']()}
				</p>
			</div>

			<OrderShippingAddress
				address={order.shippingAddress}
				label={m['AdminEditOrderPage.AdminEditOrderSummary.shippingAddress']()}
			/>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header
			><Card.Title>{m['AdminEditOrderPage.AdminEditOrderSummary.items']()}</Card.Title></Card.Header
		>
		<Card.Content>
			<OrderLineItems
				{items}
				subtotalInCents={order.subtotalInCents}
				shippingInCents={order.shippingInCents ?? 0}
				totalInCents={order.totalInCents}
				quantityLabel={(quantity) =>
					m['AdminEditOrderPage.AdminEditOrderSummary.quantity']({ quantity })}
				subtotalLabel={m['AdminEditOrderPage.AdminEditOrderSummary.subtotal']()}
				shippingLabel={m['AdminEditOrderPage.AdminEditOrderSummary.shipping']()}
				freeShippingLabel={m['AdminEditOrderPage.AdminEditOrderSummary.freeShipping']()}
				totalLabel={m['AdminEditOrderPage.AdminEditOrderSummary.total']()}
			/>
		</Card.Content>
	</Card.Root>
</div>
