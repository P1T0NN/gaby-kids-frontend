<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// TYPES
	import type { Doc } from '@convex/_generated/dataModel';

	type Props = {
		order: Pick<Doc<'orders'>, '_id' | 'code' | 'email'>;
	};

	let { order }: Props = $props();
</script>

<header class="flex flex-col items-center gap-4 text-center">
	<div class="flex size-16 items-center justify-center rounded-full bg-primary/10">
		<span class="icon-[lucide--circle-check] size-8 text-primary" aria-hidden="true"></span>
	</div>
	<h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">
		{m['CheckoutSuccessPage.CheckoutSuccessHeader.confirmedTitle']()}
	</h1>
	<p class="max-w-md text-muted-foreground">
		{m['CheckoutSuccessPage.CheckoutSuccessHeader.confirmedDescription']()}
	</p>
	<p class="text-sm text-muted-foreground">
		{m['CheckoutSuccessPage.CheckoutSuccessHeader.orderReference']()}
		<span class="font-mono font-medium text-foreground">
			#{order.code ?? order._id.slice(-8).toUpperCase()}
		</span>
	</p>
	<p class="text-sm text-muted-foreground">
		{m['CheckoutSuccessPage.CheckoutSuccessHeader.emailSentTo']({ email: order.email })}
	</p>
</header>
