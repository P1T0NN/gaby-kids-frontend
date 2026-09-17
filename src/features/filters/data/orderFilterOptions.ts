// LIBRARIES
import { m } from '@/lib/paraglide/messages';

// TYPES
import type { FilterOption } from '@/shared/features/filters/types/filterTypes.js';

/**
 * Option builders shared by the admin and customer order filters. The `allLabel`
 * (and the method labels) stay page-owned, so each page keeps its own copy.
 * The values mirror `ORDER_FILTER_VALUES`, which the server predicates validate.
 */

export function paymentStatusOptions(allLabel: string): FilterOption[] {
	return [
		{ value: '', label: allLabel },
		{ value: 'pending', label: m['OrdersFeature.OrdersPaymentStatusBadge.pending']() },
		{ value: 'paid', label: m['OrdersFeature.OrdersPaymentStatusBadge.paid']() },
		{
			value: 'refund_pending',
			label: m['OrdersFeature.OrdersPaymentStatusBadge.refundPending']()
		},
		{ value: 'refunded', label: m['OrdersFeature.OrdersPaymentStatusBadge.refunded']() }
	];
}

export function fulfillmentStatusOptions(allLabel: string): FilterOption[] {
	return [
		{ value: '', label: allLabel },
		{
			value: 'unfulfilled',
			label: m['OrdersFeature.OrdersFulfillmentStatusBadge.unfulfilled']()
		},
		{
			value: 'fulfilled',
			label: m['OrdersFeature.OrdersFulfillmentStatusBadge.fulfilled']()
		}
	];
}
