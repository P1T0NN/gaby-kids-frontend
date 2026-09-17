import { literals } from 'convex-helpers/validators';
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

import { productStatus } from './tables/products/validators/productValidators.js';
import { productVariantOption } from './tables/productVariants/validators/productVariantValidators.js';
import {
	checkoutReservationStatus,
	reservedCheckoutItem
} from './tables/checkoutReservations/validators/checkoutReservationValidators.js';

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
		productVariantOptionNames: v.array(v.string()),
		priceInCents: v.number(),
		compareAtPriceInCents: v.optional(v.number()),
		hasPriceRange: v.boolean(),
		categoryId: v.id('categories'),
		images: v.array(v.string()),
		imageKeys: v.array(v.string()),
		storagePrefix: v.string(),
		trackInventory: v.boolean(),
		upsellProductIds: v.array(v.id('products')),
		status: productStatus
	})
		.searchIndex('search_name', { searchField: 'name', filterFields: ['status'] })
		.index('by_slug', ['slug'])
		.index('by_category_id', ['categoryId'])
		.index('by_status', ['status']),
	productVariants: defineTable({
		productId: v.id('products'),
		position: v.number(),
		options: v.array(productVariantOption),
		sku: v.string(),
		/** Assigned product image keys; the first one is the variant's primary image. */
		imageKeys: v.array(v.string()),
		priceInCents: v.number(),
		compareAtPriceInCents: v.optional(v.number()),
		inventory: v.number(),
		reservedInventory: v.number()
	})
		.index('by_product_id', ['productId'])
		.index('by_sku', ['sku']),
	checkoutReservations: defineTable({
		status: checkoutReservationStatus,
		expiresAt: v.number(),
		stripeCheckoutSessionId: v.optional(v.string()),
		currency: v.string(),
		totalInCents: v.number(),
		items: v.array(reservedCheckoutItem)
	})
		.index('by_stripe_checkout_session_id', ['stripeCheckoutSessionId'])
		.index('by_status_and_expires_at', ['status', 'expiresAt']),
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
		productVariantId: v.id('productVariants'),
		name: v.string(),
		productVariantLabel: v.string(),
		sku: v.string(),
		unitPriceInCents: v.number(),
		quantity: v.number()
	})
		.index('by_order_id', ['orderId'])
		.index('by_product_id', ['productId']),
	storageUploads: defineTable({
		ownerId: v.string(),
		key: v.string(),
		expectedSize: v.number(),
		expectedContentType: v.string(),
		status: literals('pending', 'uploaded'),
		createdAt: v.number()
	})
		.index('by_key', ['key'])
		.index('by_owner_id_created_at', ['ownerId', 'createdAt'])
		.index('by_created_at', ['createdAt'])
};

export default defineSchema(tables);
