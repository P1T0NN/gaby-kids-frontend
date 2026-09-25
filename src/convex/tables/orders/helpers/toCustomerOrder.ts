// TYPES
import type { Doc } from '../../../_generated/dataModel.js';

export function toCustomerOrder(order: Doc<'orders'>) {
	return {
		_id: order._id,
		_creationTime: order._creationTime,
		code: order.code,
		currency: order.currency,
		firstName: order.firstName,
		lastName: order.lastName,
		email: order.email,
		phone: order.phone,
		fulfillmentMethod: order.fulfillmentMethod,
		shippingAddress: order.shippingAddress,
		subtotalInCents: order.subtotalInCents,
		shippingInCents: order.shippingInCents,
		totalInCents: order.totalInCents,
		paymentStatus: order.paymentStatus,
		fulfillmentStatus: order.fulfillmentStatus,
		cancelledAt: order.cancelledAt,
		updatedAt: order.updatedAt
	};
}
