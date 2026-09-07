<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import * as Card from '@/components/ui/card/index.js';

	// TYPES
	import type { Doc } from '@convex/_generated/dataModel';

	type Props = {
		order: Pick<Doc<'orders'>, 'email' | 'phone' | 'fulfillmentMethod' | 'shippingAddress'>;
	};

	let { order }: Props = $props();
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>{m['CheckoutSuccessPage.CheckoutSuccessOrderDetails.details']()}</Card.Title>
	</Card.Header>
	<Card.Content class="grid gap-5 sm:grid-cols-2">
		<div>
			<p class="text-xs text-muted-foreground">
				{m['CheckoutSuccessPage.CheckoutSuccessOrderDetails.email']()}
			</p>
			<p class="font-medium break-all">{order.email}</p>
		</div>
		<div>
			<p class="text-xs text-muted-foreground">
				{m['CheckoutSuccessPage.CheckoutSuccessOrderDetails.phone']()}
			</p>
			<p class="font-medium">{order.phone}</p>
		</div>
		<div>
			<p class="text-xs text-muted-foreground">
				{m['CheckoutSuccessPage.CheckoutSuccessOrderDetails.fulfillment']()}
			</p>
			<p class="font-medium">
				{order.fulfillmentMethod === 'delivery'
					? m['CheckoutSuccessPage.CheckoutSuccessOrderDetails.delivery']()
					: m['CheckoutSuccessPage.CheckoutSuccessOrderDetails.pickup']()}
			</p>
		</div>
		{#if order.shippingAddress}
			<div class="sm:col-span-2">
				<p class="text-xs text-muted-foreground">
					{m['CheckoutSuccessPage.CheckoutSuccessOrderDetails.shippingAddress']()}
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
