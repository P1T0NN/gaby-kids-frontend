// LIBRARIES
import { m } from '@/lib/paraglide/messages';

// TYPES
import type { Snippet } from 'svelte';
import type {
	CustomFieldContext,
	FieldConfig
} from '@/components/ui/custom-components/form/formTypes.js';

export function createCheckoutFields(
	fulfillmentField: Snippet<[CustomFieldContext]>,
	fulfillment: 'delivery' | 'pickup'
): FieldConfig[] {
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
