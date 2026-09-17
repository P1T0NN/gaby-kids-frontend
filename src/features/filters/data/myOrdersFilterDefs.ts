// LIBRARIES
import { m } from '@/lib/paraglide/messages';

// DATA
import { fulfillmentStatusOptions, paymentStatusOptions } from './orderFilterOptions.js';

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
			return paymentStatusOptions(m['MyOrdersPage.allPaymentStatuses']());
		}
	},
	{
		key: 'fulfillmentStatus',
		get label() {
			return m['MyOrdersPage.fulfillmentFilterLabel']();
		},
		get options() {
			return fulfillmentStatusOptions(m['MyOrdersPage.allFulfillmentStatuses']());
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
