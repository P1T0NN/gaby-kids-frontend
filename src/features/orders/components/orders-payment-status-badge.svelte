<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import BadgeLocalized from '@/components/ui/custom-components/badge-localized/badge-localized.svelte';

	// TYPES
	import type { BadgeVariant } from '@/components/ui/badge/index.js';
	import type { Doc } from '@convex/_generated/dataModel';

	type PaymentStatus = Doc<'orders'>['paymentStatus'];

	let { status }: { status: PaymentStatus } = $props();

	const translations = {
		pending: { en: m['OrdersFeature.OrdersPaymentStatusBadge.pending']() },
		paid: { en: m['OrdersFeature.OrdersPaymentStatusBadge.paid']() },
		refund_pending: { en: m['OrdersFeature.OrdersPaymentStatusBadge.refundPending']() },
		refunded: { en: m['OrdersFeature.OrdersPaymentStatusBadge.refunded']() }
	} satisfies Record<PaymentStatus, Record<string, string>>;

	const variants = {
		pending: 'secondary',
		paid: 'default',
		refund_pending: 'outline',
		refunded: 'destructive'
	} satisfies Record<PaymentStatus, BadgeVariant>;
</script>

<BadgeLocalized
	value={status}
	{translations}
	variant={variants[status]}
	class={status === 'pending'
		? 'border-amber-300 bg-amber-100 text-amber-900'
		: status === 'paid'
			? 'border-green-300 bg-green-100 text-green-900'
			: undefined}
/>
