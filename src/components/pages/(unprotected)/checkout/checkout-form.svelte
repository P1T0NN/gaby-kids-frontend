<script lang="ts">
	// LIBRARIES
	import { api } from '@convex/_generated/api';
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import Form from '@/components/ui/custom-components/form/form.svelte';

	// HOOKS
	import { useCart } from '@/features/cart/hooks/useCart.svelte.js';
	import { useOrders } from '@/features/orders/hooks/useOrders.svelte.js';

	// UTILS
	import { gotoParaglide } from '@/utils/gotoParaglide.js';

	// SCHEMAS
	import { createOrderSchema } from '@/shared/features/orders/schemas/ordersSchemas.js';

	// TYPES
	import type { Snippet } from 'svelte';
	import type { Id } from '@convex/_generated/dataModel.js';
	import type {
		CustomFieldContext,
		FieldConfig,
		MutationValues,
		UploadPrepareContext
	} from '@/components/ui/custom-components/form/formTypes.js';

	type CreateOrderMutation = typeof api.tables.orders.mutations.createOrder.createOrder;

	type Props = {
		values?: MutationValues<CreateOrderMutation>;
		submitting?: boolean;
	};

	let {
		values = $bindable<MutationValues<CreateOrderMutation>>({
			fulfillmentMethod: 'delivery'
		}),
		submitting = $bindable(false)
	}: Props = $props();

	const cart = useCart();
	const orders = useOrders();

	let retryKey = $state('');

	const fulfillment = $derived(values.fulfillmentMethod === 'pickup' ? 'pickup' : 'delivery');

	function createCheckoutFields(fulfillmentField: Snippet<[CustomFieldContext]>): FieldConfig[] {
		return [
			{
				kind: 'section',
				class:
					'gap-5 overflow-visible rounded-none bg-transparent py-0 shadow-none ring-0 [&>[data-slot=card-header]]:gap-2 [&>[data-slot=card-header]]:px-0 [&>[data-slot=card-content]]:px-0 [&>[data-slot=card-content]>div]:grid [&>[data-slot=card-content]>div]:gap-5 sm:[&>[data-slot=card-content]>div]:grid-cols-2 [&_[data-slot=card-title]]:text-xl',
				title: m['CheckoutPage.CheckoutForm.contact'](),
				description: m['CheckoutPage.CheckoutForm.contactHint'](),
				fields: [
					{
						kind: 'input',
						name: 'firstName',
						label: m['CheckoutPage.CheckoutForm.firstName'](),
						placeholder: 'e.g. Alex',
						type: 'text',
						required: true,
						class: '[&_input]:h-11'
					},
					{
						kind: 'input',
						name: 'lastName',
						label: m['CheckoutPage.CheckoutForm.lastName'](),
						placeholder: 'e.g. Morgan',
						type: 'text',
						required: true,
						class: '[&_input]:h-11'
					},
					{
						kind: 'input',
						name: 'email',
						label: m['CheckoutPage.CheckoutForm.email'](),
						placeholder: 'you@example.com',
						type: 'email',
						required: true,
						class: '[&_input]:h-11'
					},
					{
						kind: 'input',
						name: 'phone',
						label: m['CheckoutPage.CheckoutForm.phone'](),
						placeholder: 'e.g. +1 555 123 4567',
						type: 'tel',
						required: true,
						class: '[&_input]:h-11'
					}
				]
			},
			{
				kind: 'custom',
				name: 'fulfillmentMethod',
				label: m['CheckoutPage.CheckoutForm.fulfillment'](),
				class:
					'gap-5 border-t pt-8 [&>[data-slot=field-label]]:text-xl [&>[data-slot=field-label]]:font-semibold',
				render: fulfillmentField
			},
			...(fulfillment === 'delivery'
				? [
						{
							kind: 'section' as const,
							class:
								'gap-5 overflow-visible rounded-none bg-transparent py-0 shadow-none ring-0 [&>[data-slot=card-header]]:px-0 [&>[data-slot=card-content]]:px-0 [&>[data-slot=card-content]>div]:grid [&>[data-slot=card-content]>div]:gap-5 sm:[&>[data-slot=card-content]>div]:grid-cols-2 [&_[data-slot=card-title]]:text-lg',
							title: m['CheckoutPage.CheckoutForm.address'](),
							fields: [
								{
									kind: 'input' as const,
									name: 'street',
									label: m['CheckoutPage.CheckoutForm.street'](),
									placeholder: '123 Main Street',
									type: 'text' as const,
									required: true,
									class: 'sm:col-span-2 [&_input]:h-11'
								},
								{
									kind: 'input' as const,
									name: 'apartment',
									label: m['CheckoutPage.CheckoutForm.apartment'](),
									placeholder: 'Apartment or suite number',
									type: 'text' as const,
									class: 'sm:col-span-2 [&_input]:h-11'
								},
								{
									kind: 'input' as const,
									name: 'postalCode',
									label: m['CheckoutPage.CheckoutForm.postalCode'](),
									placeholder: 'e.g. 10001',
									type: 'text' as const,
									required: true,
									class: '[&_input]:h-11'
								},
								{
									kind: 'input' as const,
									name: 'city',
									label: m['CheckoutPage.CheckoutForm.city'](),
									placeholder: 'e.g. New York',
									type: 'text' as const,
									required: true,
									class: '[&_input]:h-11'
								},
								{
									kind: 'input' as const,
									name: 'country',
									label: m['CheckoutPage.CheckoutForm.country'](),
									placeholder: 'e.g. United States',
									type: 'text' as const,
									required: true,
									class: 'sm:col-span-2 [&_input]:h-11'
								}
							]
						}
					]
				: [])
		] satisfies FieldConfig[];
	}

	function prepareOrderArgs({ values }: UploadPrepareContext<CreateOrderMutation>) {
		if (!retryKey) retryKey = crypto.randomUUID();

		const fulfillmentMethod: 'delivery' | 'pickup' =
			values.fulfillmentMethod === 'pickup' ? 'pickup' : 'delivery';

		return {
			retryKey,
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

	function handleOrderSuccess(orderId: Id<'orders'>) {
		orders.addOrder(orderId, retryKey);
		cart.replaceItems([]);
		return gotoParaglide(`/checkout/success?key=${encodeURIComponent(retryKey)}`);
	}
</script>

{#snippet fulfillmentField({ field, inputValue, setValue, disabled }: CustomFieldContext)}
	<div class="grid gap-3 sm:grid-cols-2">
		<label
			class="flex cursor-pointer items-center gap-3 rounded-xl border p-4 has-checked:border-primary has-checked:bg-primary/5 has-focus-visible:ring-2 has-focus-visible:ring-ring has-disabled:cursor-not-allowed has-disabled:opacity-50"
		>
			<input
				id={field.name}
				type="radio"
				name={field.name}
				value="delivery"
				checked={inputValue(field.name) === 'delivery'}
				onchange={() => setValue(field.name, 'delivery')}
				class="size-4 accent-primary"
				{disabled}
			/>
			<span class="flex flex-1 flex-col gap-1">
				<span class="font-medium">{m['CheckoutPage.CheckoutForm.delivery']()}</span>
				<span class="text-xs text-muted-foreground">
					{m['CheckoutPage.CheckoutForm.deliveryHint']()}
				</span>
			</span>
			<span class="icon-[lucide--truck] size-5 text-muted-foreground" aria-hidden="true"></span>
		</label>

		<label
			class="flex cursor-pointer items-center gap-3 rounded-xl border p-4 has-checked:border-primary has-checked:bg-primary/5 has-focus-visible:ring-2 has-focus-visible:ring-ring has-disabled:cursor-not-allowed has-disabled:opacity-50"
		>
			<input
				id={`${field.name}-pickup`}
				type="radio"
				name={field.name}
				value="pickup"
				checked={inputValue(field.name) === 'pickup'}
				onchange={() => setValue(field.name, 'pickup')}
				class="size-4 accent-primary"
				{disabled}
			/>
			<span class="flex flex-1 flex-col gap-1">
				<span class="font-medium">{m['CheckoutPage.CheckoutForm.pickup']()}</span>
				<span class="text-xs text-muted-foreground">
					{m['CheckoutPage.CheckoutForm.pickupHint']()}
				</span>
			</span>
			<span class="icon-[lucide--store] size-5 text-muted-foreground" aria-hidden="true"></span>
		</label>
	</div>
{/snippet}

<Form
	id="checkout-form"
	class="flex min-w-0 flex-col gap-9"
	function={api.tables.orders.mutations.createOrder.createOrder}
	fields={createCheckoutFields(fulfillmentField)}
	schema={createOrderSchema}
	prepareArgs={prepareOrderArgs}
	bind:values
	bind:submitting
	onSuccess={handleOrderSuccess}
	successMessage={m['CheckoutPage.CheckoutForm.orderCreated']()}
	errorMessage={m['CheckoutPage.CheckoutForm.orderCreateError']()}
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
