<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import * as Card from '@/components/ui/card/index.js';
	import OrderLineItems from '@/features/orders/components/order-line-items.svelte';

	// TYPES
	import type { Doc } from '@convex/_generated/dataModel';

	type Props = {
		order: Pick<Doc<'orders'>, 'subtotalInCents' | 'totalInCents'>;
		items: Doc<'orderItems'>[];
	};

	let { order, items }: Props = $props();
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>{m['CheckoutSuccessPage.CheckoutSuccessOrderSummary.summary']()}</Card.Title>
	</Card.Header>
	<Card.Content>
		<OrderLineItems
			{items}
			subtotalInCents={order.subtotalInCents}
			totalInCents={order.totalInCents}
			quantityLabel={(quantity) =>
				m['CheckoutSuccessPage.CheckoutSuccessOrderSummary.quantity']({ quantity })}
			subtotalLabel={m['CheckoutSuccessPage.CheckoutSuccessOrderSummary.subtotal']()}
			totalLabel={m['CheckoutSuccessPage.CheckoutSuccessOrderSummary.total']()}
		/>
	</Card.Content>
</Card.Root>
