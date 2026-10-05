<script lang="ts">
	// LIBRARIES
	import { api } from '@convex/_generated/api';
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import CheckoutForm from '@/components/pages/(unprotected)/checkout/checkout-form.svelte';
	import CheckoutHeader from '@/components/pages/(unprotected)/checkout/checkout-header.svelte';
	import CheckoutSummary from '@/components/pages/(unprotected)/checkout/checkout-summary/checkout-summary.svelte';
	import Section from '@/components/ui/custom-components/section/section.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';

	// TYPES
	import type { AppliedCoupon } from '@/shared/features/coupons/types/couponTypes.js';
	import type { MutationValues } from '@/components/ui/custom-components/form/formTypes.js';

	type CreateStripeCheckoutAction =
		typeof api.stripe.actions.createStripeCheckout.createStripeCheckout;

	let values = $state<MutationValues<CreateStripeCheckoutAction>>({
		fulfillmentMethod: 'delivery'
	});

	let coupon = $state<AppliedCoupon | null>(null);
	let submitting = $state(false);
</script>

<SvelteHead
	title={m['CheckoutPage.title']()}
	description={m['CheckoutPage.description']()}
	noindex
/>

<Section as="main" size="sm" width="wide" containerClass="flex flex-col gap-10">
	<CheckoutHeader />

	<div class="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-16">
		<CheckoutForm bind:values bind:submitting couponCode={coupon?.code} />
		<CheckoutSummary {values} {submitting} bind:applied={coupon} />
	</div>
</Section>
