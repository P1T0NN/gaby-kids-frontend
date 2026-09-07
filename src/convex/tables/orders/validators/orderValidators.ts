// LIBRARIES
import { literals } from 'convex-helpers/validators';
import { v } from 'convex/values';

export const paymentStatus = literals('pending', 'paid', 'refund_pending', 'refunded');
export const fulfillmentStatus = literals('unfulfilled', 'fulfilled');
export const fulfillmentMethod = literals('delivery', 'pickup');
export const orderAdminAction = literals(
	'fulfill',
	'unfulfill',
	'cancel',
	'restore',
	'request_refund'
);

export const shippingAddress = v.object({
	street: v.string(),
	apartment: v.optional(v.string()),
	postalCode: v.string(),
	city: v.string(),
	country: v.string()
});

export const orderResult = v.object({
	_id: v.id('orders'),
	_creationTime: v.number(),
	customerId: v.optional(v.string()),
	code: v.string(),
	retryKey: v.string(),
	lineFingerprint: v.string(),
	currency: v.string(),
	firstName: v.string(),
	lastName: v.string(),
	email: v.string(),
	phone: v.string(),
	fulfillmentMethod,
	shippingAddress: v.optional(shippingAddress),
	subtotalInCents: v.number(),
	totalInCents: v.number(),
	paymentStatus,
	fulfillmentStatus,
	cancelledAt: v.optional(v.number()),
	internalNote: v.optional(v.string()),
	updatedAt: v.number()
});

export const orderItemResult = v.object({
	_id: v.id('orderItems'),
	_creationTime: v.number(),
	orderId: v.id('orders'),
	productId: v.id('products'),
	name: v.string(),
	unitPriceInCents: v.number(),
	quantity: v.number()
});

export const orderPage = v.object({
	items: v.array(orderResult),
	nextCursor: v.union(v.string(), v.null()),
	hasNextPage: v.boolean(),
	pageSize: v.number(),
	total: v.optional(v.number())
});

export const orderDetailResult = v.object({ order: orderResult, items: v.array(orderItemResult) });

export const myOrderResult = v.object({
	_id: v.id('orders'),
	_creationTime: v.number(),
	code: v.string(),
	currency: v.string(),
	fulfillmentMethod,
	totalInCents: v.number(),
	paymentStatus,
	fulfillmentStatus,
	cancelledAt: v.optional(v.number())
});

export const myOrderPage = v.object({
	items: v.array(myOrderResult),
	nextCursor: v.union(v.string(), v.null()),
	hasNextPage: v.boolean(),
	pageSize: v.number(),
	total: v.optional(v.number()),
	invalidOrderIds: v.array(v.string()),
	syncOrders: v.array(v.object({ id: v.id('orders'), retryKey: v.string() }))
});

export const customerOrderResult = v.object({
	_id: v.id('orders'),
	_creationTime: v.number(),
	code: v.string(),
	currency: v.string(),
	firstName: v.string(),
	lastName: v.string(),
	email: v.string(),
	phone: v.string(),
	fulfillmentMethod,
	shippingAddress: v.optional(shippingAddress),
	subtotalInCents: v.number(),
	totalInCents: v.number(),
	paymentStatus,
	fulfillmentStatus,
	cancelledAt: v.optional(v.number()),
	updatedAt: v.number()
});

export const customerOrderDetailResult = v.object({
	order: customerOrderResult,
	items: v.array(orderItemResult)
});
