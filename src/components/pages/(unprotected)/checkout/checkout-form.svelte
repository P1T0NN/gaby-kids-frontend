<script lang="ts">
	// SVELTEKIT IMPORTS
	import { page } from '$app/state';

	// LIBRARIES
	import { api } from '@convex/_generated/api';
	import { m } from '@/lib/paraglide/messages';

	// CONFIG
	import { STRIPE_CHECKOUT_CAPTCHA_ACTION } from '@/shared/features/captcha/config.js';

	// COMPONENTS
	import Form from '@/components/ui/custom-components/form/form.svelte';
	import * as Field from '@/components/ui/field/index.js';
	import * as RadioGroup from '@/components/ui/radio-group/index.js';

	// HOOKS
	import { useCart } from '@/features/cart/hooks/useCart.svelte.js';

	// UTILS
	import { createCheckoutFields } from '@/features/checkout/forms/createCheckoutForm.js';

	// SCHEMAS
	import { checkoutSchema } from '@/shared/features/orders/schemas/ordersSchemas.js';

	// TYPES
	import type { Id } from '@convex/_generated/dataModel.js';
	import type {
		CustomFieldContext,
		MutationValues,
		UploadPrepareContext
	} from '@/components/ui/custom-components/form/formTypes.js';

	type CreateStripeCheckoutAction =
		typeof api.stripe.actions.createStripeCheckout.createStripeCheckout;

	type Props = {
		values?: MutationValues<CreateStripeCheckoutAction>;
		submitting?: boolean;
	};

	let {
		values = $bindable<MutationValues<CreateStripeCheckoutAction>>({
			fulfillmentMethod: 'delivery'
		}),
		submitting = $bindable(false)
	}: Props = $props();

	const authenticated = $derived(page.data.authState.isAuthenticated);
	const cart = useCart();

	const fulfillment = $derived(values.fulfillmentMethod === 'pickup' ? 'pickup' : 'delivery');

	function prepareCheckoutArgs({ values }: UploadPrepareContext<CreateStripeCheckoutAction>) {
		const fulfillmentMethod: 'delivery' | 'pickup' =
			values.fulfillmentMethod === 'pickup' ? 'pickup' : 'delivery';

		return {
			// SAFETY: Convex validates every submitted cart ID with v.id('products').
			items: cart.items.map((item) => ({
				productId: item.id as Id<'products'>,
				quantity: item.quantity
			})),
			firstName: String(values.firstName ?? ''),
			lastName: String(values.lastName ?? ''),
			email: String(values.email ?? ''),
			phone: String(values.phone ?? ''),
			fulfillmentMethod,
			shippingAddress:
				fulfillmentMethod === 'delivery'
					? {
							street: String(values.street ?? ''),
							apartment: String(values.apartment ?? '') || undefined,
							postalCode: String(values.postalCode ?? ''),
							city: String(values.city ?? ''),
							country: String(values.country ?? '')
						}
					: undefined
		};
	}

	function handleCheckoutStarted(result: { checkoutUrl: string }) {
		window.location.assign(result.checkoutUrl);
	}
</script>

{#snippet fulfillmentField({ field, inputValue, setValue, disabled }: CustomFieldContext)}
	<RadioGroup.Root
		value={inputValue(field.name)}
		onValueChange={(value) => setValue(field.name, value)}
		orientation="horizontal"
		class="grid gap-3 sm:grid-cols-2"
		{disabled}
	>
		<Field.Label
			for={`${field.name}-delivery`}
			class="flex w-full cursor-pointer items-center gap-3 rounded-xl border p-4 has-focus-visible:ring-2 has-focus-visible:ring-ring has-disabled:cursor-not-allowed has-disabled:opacity-50 has-data-checked:border-primary has-data-checked:bg-primary/5"
		>
			<RadioGroup.Item id={`${field.name}-delivery`} value="delivery" />
			<span class="flex flex-1 flex-col gap-1">
				<span class="font-medium">{m['CheckoutPage.CheckoutForm.delivery']()}</span>
				<span class="text-xs text-muted-foreground">
					{m['CheckoutPage.CheckoutForm.deliveryHint']()}
				</span>
			</span>
			<span class="icon-[lucide--truck] size-5 text-muted-foreground" aria-hidden="true"></span>
		</Field.Label>

		<Field.Label
			for={`${field.name}-pickup`}
			class="flex w-full cursor-pointer items-center gap-3 rounded-xl border p-4 has-focus-visible:ring-2 has-focus-visible:ring-ring has-disabled:cursor-not-allowed has-disabled:opacity-50 has-data-checked:border-primary has-data-checked:bg-primary/5"
		>
			<RadioGroup.Item id={`${field.name}-pickup`} value="pickup" />
			<span class="flex flex-1 flex-col gap-1">
				<span class="font-medium">{m['CheckoutPage.CheckoutForm.pickup']()}</span>
				<span class="text-xs text-muted-foreground">
					{m['CheckoutPage.CheckoutForm.pickupHint']()}
				</span>
			</span>
			<span class="icon-[lucide--store] size-5 text-muted-foreground" aria-hidden="true"></span>
		</Field.Label>
	</RadioGroup.Root>
{/snippet}

<Form
	id="checkout-form"
	class="flex min-w-0 flex-col gap-9"
	function={api.stripe.actions.createStripeCheckout.createStripeCheckout}
	functionType="action"
	captchaAction={authenticated ? undefined : STRIPE_CHECKOUT_CAPTCHA_ACTION}
	fields={createCheckoutFields(fulfillmentField, fulfillment)}
	schema={checkoutSchema}
	prepareArgs={prepareCheckoutArgs}
	bind:values
	bind:submitting
	onSuccess={handleCheckoutStarted}
	successMessage={m['CheckoutPage.CheckoutForm.orderCreated']()}
	errorMessage={m['CheckoutPage.CheckoutForm.orderCreateError']()}
	resetOnSuccess={false}
>
	{#if fulfillment === 'pickup'}
		<p class="rounded-lg bg-muted/50 p-4 text-sm leading-relaxed text-muted-foreground">
			{m['CheckoutPage.CheckoutForm.pickupInfo']()}
		</p>
	{/if}

	<div class="flex items-start gap-3 border-t pt-6">
		<span class="mt-0.5 icon-[lucide--credit-card] size-5 text-muted-foreground" aria-hidden="true"
		></span>

		<div class="flex flex-col gap-1">
			<h2 class="text-sm font-medium">{m['CheckoutPage.CheckoutForm.payment']()}</h2>
			<p class="text-sm text-muted-foreground">{m['CheckoutPage.CheckoutForm.paymentHint']()}</p>
		</div>
	</div>
</Form>
