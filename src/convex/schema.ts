import { literals } from 'convex-helpers/validators';
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

import { productStatus } from './tables/products/validators/productValidators.js';

export const tables = {
	categories: defineTable({
		name: v.string(),
		slug: v.string(),
		status: literals('active', 'archived'),
		imageKey: v.optional(v.string())
	})
		.searchIndex('search_name', { searchField: 'name' })
		.index('by_slug', ['slug'])
		.index('by_status', ['status']),
	products: defineTable({
		name: v.string(),
		slug: v.string(),
		description: v.string(),
		priceInCents: v.number(),
		compareAtPriceInCents: v.optional(v.number()),
		categoryId: v.id('categories'),
		images: v.array(v.string()),
		imageKeys: v.array(v.string()),
		storagePrefix: v.string(),
		upsellProductIds: v.optional(v.array(v.id('products'))),
		status: productStatus
	})
		.searchIndex('search_name', { searchField: 'name', filterFields: ['status'] })
		.index('by_slug', ['slug'])
		.index('by_category_id', ['categoryId'])
		.index('by_status', ['status']),
	orders: defineTable({
		customerId: v.optional(v.string()),
		code: v.string(),
		receiptToken: v.string(),
		lineFingerprint: v.string(),
		currency: v.string(),
		firstName: v.string(),
		lastName: v.string(),
		email: v.string(),
		phone: v.string(),
		fulfillmentMethod: literals('delivery', 'pickup'),
		shippingAddress: v.optional(
			v.object({
				street: v.string(),
				apartment: v.optional(v.string()),
				postalCode: v.string(),
				city: v.string(),
				country: v.string()
			})
		),
		subtotalInCents: v.number(),
		totalInCents: v.number(),
		paymentStatus: literals('pending', 'paid', 'refund_pending', 'refunded'),
		stripeCheckoutSessionId: v.optional(v.string()),
		stripePaymentIntentId: v.optional(v.string()),
		checkoutStatus: v.optional(literals('open', 'complete', 'expired')),
		paidAt: v.optional(v.number()),
		refundedAt: v.optional(v.number()),
		refundedAmountInCents: v.optional(v.number()),
		fulfillmentStatus: literals('unfulfilled', 'fulfilled'),
		cancelledAt: v.optional(v.number()),
		internalNote: v.optional(v.string()),
		updatedAt: v.number()
	})
		.index('by_code', ['code'])
		.index('by_receiptToken', ['receiptToken'])
		.index('by_stripeCheckoutSessionId', ['stripeCheckoutSessionId'])
		.index('by_stripePaymentIntentId', ['stripePaymentIntentId'])
		.index('by_customer_id', ['customerId'])
		.index('by_payment_status', ['paymentStatus'])
		.index('by_fulfillment_status', ['fulfillmentStatus'])
		.index('by_fulfillment_method', ['fulfillmentMethod'])
		.index('by_payment_status_and_fulfillment_status', ['paymentStatus', 'fulfillmentStatus'])
		.index('by_payment_status_and_fulfillment_method', ['paymentStatus', 'fulfillmentMethod'])
		.index('by_fulfillment_status_and_fulfillment_method', [
			'fulfillmentStatus',
			'fulfillmentMethod'
		])
		.index('by_payment_status_and_fulfillment_status_and_fulfillment_method', [
			'paymentStatus',
			'fulfillmentStatus',
			'fulfillmentMethod'
		]),
	orderItems: defineTable({
		orderId: v.id('orders'),
		productId: v.id('products'),
		name: v.string(),
		unitPriceInCents: v.number(),
		quantity: v.number()
	})
		.index('by_order_id', ['orderId'])
		.index('by_product_id', ['productId']),
	storageUploads: defineTable({
		ownerId: v.string(),
		key: v.string(),
		expectedSize: v.optional(v.number()),
		expectedContentType: v.optional(v.string()),
		status: literals('pending', 'uploaded'),
		createdAt: v.number()
	})
		.index('by_key', ['key'])
		.index('by_owner_id_created_at', ['ownerId', 'createdAt'])
		.index('by_created_at', ['createdAt'])
};

export default defineSchema(tables);
