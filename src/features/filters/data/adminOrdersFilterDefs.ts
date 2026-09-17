// LIBRARIES
import { m } from '@/lib/paraglide/messages';

// DATA
import { fulfillmentStatusOptions, paymentStatusOptions } from './orderFilterOptions.js';

// TYPES
import type { FilterDef } from '@/shared/features/filters/types/filterTypes.js';

export const ADMIN_ORDERS_FILTER_DEFS = [
	{
		key: 'paymentStatus',
		get label() {
			return m['AdminOrdersPage.paymentFilterLabel']();
		},
		get options() {
			return paymentStatusOptions(m['AdminOrdersPage.allPaymentStatuses']());
		}
	},
	{
		key: 'fulfillmentStatus',
		get label() {
			return m['AdminOrdersPage.fulfillmentFilterLabel']();
		},
		get options() {
			return fulfillmentStatusOptions(m['AdminOrdersPage.allFulfillmentStatuses']());
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
