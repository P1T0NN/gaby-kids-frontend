// LIBRARIES
import { m } from '@/lib/paraglide/messages';

// TYPES
import type { FilterDef } from '@/shared/features/filters/types/filterTypes.js';

export const ADMIN_ORDERS_FILTER_DEFS = [
	{
		key: 'paymentStatus',
		get label() {
			return m['AdminOrdersPage.paymentFilterLabel']();
		},
		get options() {
			return [
				{ value: '', label: m['AdminOrdersPage.allPaymentStatuses']() },
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
			return m['AdminOrdersPage.fulfillmentFilterLabel']();
		},
		get options() {
			return [
				{ value: '', label: m['AdminOrdersPage.allFulfillmentStatuses']() },
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
			return m['AdminOrdersPage.methodFilterLabel']();
		},
		get options() {
			return [
				{ value: '', label: m['AdminOrdersPage.allMethods']() },
				{ value: 'delivery', label: m['AdminOrdersPage.AdminOrdersTableItem.delivery']() },
				{ value: 'pickup', label: m['AdminOrdersPage.AdminOrdersTableItem.pickup']() }
			];
		}
	}
] satisfies FilterDef[];
