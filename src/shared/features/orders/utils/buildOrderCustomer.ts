// SCHEMAS
import { createOrderSchema } from '../schemas/ordersSchemas.js';

// TYPES
type OrderSnapshot = ReturnType<typeof createOrderSchema.parse>;

/** The order document's customer fields — everything in the snapshot except its line items. */
export function buildOrderCustomer(data: OrderSnapshot): Omit<OrderSnapshot, 'items'> {
	const customer: Omit<OrderSnapshot, 'items'> = {
		receiptToken: data.receiptToken,
		firstName: data.firstName,
		lastName: data.lastName,
		email: data.email,
		phone: data.phone,
		fulfillmentMethod: data.fulfillmentMethod
	};

	if (data.shippingAddress) customer.shippingAddress = data.shippingAddress;

	return customer;
}
