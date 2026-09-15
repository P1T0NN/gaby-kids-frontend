<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime';

	// COMPONENTS
	import * as Card from '@/components/ui/card/index.js';

	// UTILS
	import { formatPrice } from '@/shared/utils/pricing.js';
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
				<p class="font-medium capitalize">{order.fulfillmentMethod}</p>
			</div>

			{#if order.shippingAddress}
				<div class="sm:col-span-2">
					<p class="text-xs text-muted-foreground">
						{m['AdminEditOrderPage.AdminEditOrderSummary.shippingAddress']()}
					</p>
					<address class="mt-1 font-medium not-italic">
						{order.shippingAddress.street}{#if order.shippingAddress.apartment}, {order
								.shippingAddress.apartment}{/if}<br />
						{order.shippingAddress.postalCode}
						{order.shippingAddress.city},
						{order.shippingAddress.country}
					</address>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header
			><Card.Title>{m['AdminEditOrderPage.AdminEditOrderSummary.items']()}</Card.Title></Card.Header
		>
		<Card.Content>
			<ul class="divide-y divide-border">
				{#each items as item (item._id)}
					<li class="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
						<div class="min-w-0">
							<p class="truncate font-medium">{item.name}</p>
							<p class="text-xs text-muted-foreground">
								{m['AdminEditOrderPage.AdminEditOrderSummary.quantity']({
									quantity: item.quantity
								})}
							</p>
						</div>
						<p class="shrink-0 font-medium tabular-nums">
							{formatPrice(item.unitPriceInCents * item.quantity)}
						</p>
					</li>
				{/each}
			</ul>

			<dl class="mt-5 flex flex-col gap-2 border-t pt-5 text-sm">
				<div class="flex justify-between">
					<dt class="text-muted-foreground">
						{m['AdminEditOrderPage.AdminEditOrderSummary.subtotal']()}
					</dt>
					<dd>{formatPrice(order.subtotalInCents)}</dd>
				</div>
				
				<div class="flex justify-between text-base font-semibold">
					<dt>{m['AdminEditOrderPage.AdminEditOrderSummary.total']()}</dt>
					<dd>{formatPrice(order.totalInCents)}</dd>
				</div>
			</dl>
		</Card.Content>
	</Card.Root>
</div>
