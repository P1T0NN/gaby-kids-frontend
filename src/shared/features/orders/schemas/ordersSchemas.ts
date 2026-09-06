// LIBRARIES
import { z } from 'zod';

// CONFIG
import { ORDER_CONFIG } from '../config.js';

// TYPES
import type { Id } from '../../../../convex/_generated/dataModel.js';

const MAX_RETRY_KEY_LENGTH = 100;
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 320;
const MAX_PHONE_LENGTH = 50;
const MAX_STREET_LENGTH = 200;
const MAX_APARTMENT_LENGTH = 200;
const MAX_POSTAL_CODE_LENGTH = 30;
const MAX_CITY_LENGTH = 100;
const MAX_COUNTRY_LENGTH = 100;

const productIdSchema = z
	.string()
	.min(1)
	.transform((value) => {
		// SAFETY: Convex's v.id('products') validator remains authoritative at the mutation boundary.
		return value as Id<'products'>;
	});

const orderIdSchema = z
	.string()
	.min(1)
	.transform((value) => {
		// SAFETY: Convex's v.id('orders') validator remains authoritative at the mutation boundary.
		return value as Id<'orders'>;
	});

const optionalTrimmedString = (maxLength: number) =>
	z
		.string()
		.trim()
		.max(maxLength)
		.transform((value) => value || undefined)
		.optional();

const shippingAddressSchema = z.object({
	street: z.string().trim().min(1).max(MAX_STREET_LENGTH),
	apartment: optionalTrimmedString(MAX_APARTMENT_LENGTH),
	postalCode: z.string().trim().min(1).max(MAX_POSTAL_CODE_LENGTH),
	city: z.string().trim().min(1).max(MAX_CITY_LENGTH),
	country: z.string().trim().min(1).max(MAX_COUNTRY_LENGTH)
});

export const createOrderSchema = z
	.object({
		retryKey: z.string().trim().min(1).max(MAX_RETRY_KEY_LENGTH),
		items: z
			.array(
				z.object({
					productId: productIdSchema,
					quantity: z.number().int().min(1).max(ORDER_CONFIG.maxQuantity)
				})
			)
			.min(1)
			.max(ORDER_CONFIG.maxLines),
		firstName: z.string().trim().min(1).max(MAX_NAME_LENGTH),
		lastName: z.string().trim().min(1).max(MAX_NAME_LENGTH),
		email: z.string().trim().toLowerCase().email().max(MAX_EMAIL_LENGTH),
		phone: z.string().trim().min(1).max(MAX_PHONE_LENGTH),
		fulfillmentMethod: z.enum(['delivery', 'pickup']),
		shippingAddress: shippingAddressSchema.optional()
	})
	.refine((value) => value.fulfillmentMethod !== 'delivery' || value.shippingAddress, {
		path: ['shippingAddress']
	});

export const updateOrderAdminSchema = z.object({
	id: orderIdSchema,
	action: z.enum(['fulfill', 'unfulfill', 'cancel', 'restore', 'request_refund'])
});
