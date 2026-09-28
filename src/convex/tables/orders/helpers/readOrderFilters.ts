// UTILS
import { isFulfillmentMethod } from '../../../../shared/features/orders/utils/isFulfillmentMethod.js';
import { isFulfillmentStatus } from '../../../../shared/features/orders/utils/isFulfillmentStatus.js';
import { isPaymentStatus } from '../../../../shared/features/orders/utils/isPaymentStatus.js';

// TYPES
import type { Doc } from '../../../_generated/dataModel.js';

export type OrderFilters = {
	paymentStatus?: Doc<'orders'>['paymentStatus'];
	fulfillmentStatus?: Doc<'orders'>['fulfillmentStatus'];
	fulfillmentMethod?: Doc<'orders'>['fulfillmentMethod'];
};

/** Read the validated order filter values from the symbolic filter record. */
export function readOrderFilters(filters: Record<string, string> | undefined): OrderFilters {
	const paymentStatus = filters?.paymentStatus;
	const fulfillmentStatus = filters?.fulfillmentStatus;
	const fulfillmentMethod = filters?.fulfillmentMethod;

	return {
		paymentStatus: isPaymentStatus(paymentStatus) ? paymentStatus : undefined,
		fulfillmentStatus: isFulfillmentStatus(fulfillmentStatus) ? fulfillmentStatus : undefined,
		fulfillmentMethod: isFulfillmentMethod(fulfillmentMethod) ? fulfillmentMethod : undefined
	};
}
