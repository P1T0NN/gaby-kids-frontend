// LIBRARIES
import { m } from '@/lib/paraglide/messages';

// TYPES
import type { FilterDef } from '@/shared/features/filters/types/filterTypes.js';

export const MY_ORDERS_FILTER_DEFS = [
	{
		key: '_creationTime',
		get label() {
			return m['MyOrdersPage.sortLabel']();
		},
		get options() {
			return [
				{ value: '', label: m['MyOrdersPage.newestFirst']() },
				{ value: 'asc', label: m['MyOrdersPage.oldestFirst']() }
			];
		}
	},
	{
		key: 'paymentStatus',
		get label() {
			return m['MyOrdersPage.paymentFilterLabel']();
		},
		get options() {
			return [
				{ value: '', label: m['MyOrdersPage.allPaymentStatuses']() },
				{ value: 'pending', label: m['OrdersFeature.OrdersPaymentStatusBadge.pending']() },
				{ value: 'paid', label: m['OrdersFeature.OrdersPaymentStatusBadge.paid']() },
				{
					value: 'refund_pending',
					label: m['OrdersFeature.OrdersPaymentStatusBadge.refundPending']()
				},
				{ value: 'refunded', label: m['OrdersFeature.OrdersPaymentStatusBadge.refunded']() }
			];
		}
	},
	{
		key: 'fulfillmentStatus',
		get label() {
			return m['MyOrdersPage.fulfillmentFilterLabel']();
		},
		get options() {
			return [
				{ value: '', label: m['MyOrdersPage.allFulfillmentStatuses']() },
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
	},
	{
		key: 'fulfillmentMethod',
		get label() {
			return m['MyOrdersPage.methodFilterLabel']();
		},
		get options() {
			return [
				{ value: '', label: m['MyOrdersPage.allMethods']() },
				{ value: 'delivery', label: m['MyOrdersPage.MyOrdersItem.delivery']() },
				{ value: 'pickup', label: m['MyOrdersPage.MyOrdersItem.pickup']() }
			];
		}
	}
] satisfies FilterDef[];
