<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import * as Card from '@/components/ui/card/index.js';

	// UTILS
	import { formatPrice } from '@/shared/features/cart/utils/formatPrice.js';

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
		<ul class="divide-y divide-border">
			{#each items as item (item._id)}
				<li class="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
					<div class="min-w-0">
						<p class="truncate font-medium">{item.name}</p>
						<p class="text-xs text-muted-foreground">
							{m['CheckoutSuccessPage.CheckoutSuccessOrderSummary.quantity']({
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
					{m['CheckoutSuccessPage.CheckoutSuccessOrderSummary.subtotal']()}
				</dt>
				<dd class="tabular-nums">{formatPrice(order.subtotalInCents)}</dd>
			</div>
			<div class="flex justify-between text-base font-semibold">
				<dt>{m['CheckoutSuccessPage.CheckoutSuccessOrderSummary.total']()}</dt>
				<dd class="tabular-nums">{formatPrice(order.totalInCents)}</dd>
			</div>
		</dl>
	</Card.Content>
</Card.Root>
