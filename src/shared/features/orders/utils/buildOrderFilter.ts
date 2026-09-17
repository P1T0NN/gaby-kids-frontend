// DATA
import { ORDER_FILTER_VALUES } from '../data/ordersData.js';

// TYPES
import type { ConvexFilter } from '../../filters/types/filterTypesConvex.js';

// UTILS
import { isOrderFilterField } from './isOrderFilterField.js';
import { eqMap } from '../../filters/utils/commonPredicatesConvex.js';

/** Order filter values are stored verbatim, so each whitelist becomes an identity map. */
const toIdentityMap = (values: readonly string[]): Record<string, string> =>
	Object.fromEntries(values.map((value) => [value, value]));

const ORDER_FILTER_PREDICATES = {
	paymentStatus: eqMap('paymentStatus', toIdentityMap(ORDER_FILTER_VALUES.paymentStatus)),
	fulfillmentStatus: eqMap(
		'fulfillmentStatus',
		toIdentityMap(ORDER_FILTER_VALUES.fulfillmentStatus)
	),
	fulfillmentMethod: eqMap(
		'fulfillmentMethod',
		toIdentityMap(ORDER_FILTER_VALUES.fulfillmentMethod)
	)
};

export function buildOrderFilter(key: string, value: string): ConvexFilter | undefined {
	if (!isOrderFilterField(key)) return undefined;
	return ORDER_FILTER_PREDICATES[key](value);
}
