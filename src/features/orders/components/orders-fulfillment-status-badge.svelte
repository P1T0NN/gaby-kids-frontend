<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	
	// COMPONENTS
	import BadgeLocalized from '@/components/ui/custom-components/badge-localized/badge-localized.svelte';

	// TYPES
	import type { BadgeVariant } from '@/components/ui/badge/index.js';
	import type { Doc } from '@convex/_generated/dataModel';

	type FulfillmentStatus = Doc<'orders'>['fulfillmentStatus'];

	let { status }: { status: FulfillmentStatus } = $props();

	const translations = {
		unfulfilled: { en: m['OrdersFeature.OrdersFulfillmentStatusBadge.unfulfilled']() },
		fulfilled: { en: m['OrdersFeature.OrdersFulfillmentStatusBadge.fulfilled']() }
	} satisfies Record<FulfillmentStatus, Record<string, string>>;

	const variants = {
		unfulfilled: 'secondary',
		fulfilled: 'default'
	} satisfies Record<FulfillmentStatus, BadgeVariant>;

</script>

<BadgeLocalized value={status} {translations} variant={variants[status]} />
