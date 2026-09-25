// LIBRARIES
import { z } from 'zod';

export type typesBackendResult<Code extends string = string> =
	{ success: true } | { success: false; code: Code };

export const backendErrorDataSchema = z.discriminatedUnion('code', [
	z.object({ code: z.literal('UNAUTHENTICATED') }),
	z.object({ code: z.literal('FORBIDDEN') }),
	z.object({ code: z.literal('CAPTCHA_FAILED') }),
	z.object({ code: z.literal('INVALID_PRODUCT_DATA') }),
	z.object({ code: z.literal('PRODUCT_NOT_FOUND') }),
	z.object({ code: z.literal('INVALID_UPSELL_DATA') }),
	z.object({ code: z.literal('UPSELL_PRODUCT_UNAVAILABLE') }),
	z.object({ code: z.literal('PRODUCT_SLUG_TAKEN') }),
	z.object({ code: z.literal('PRODUCT_DELETE_RESTRICTED') }),
	z.object({ code: z.literal('CANNOT_DISABLE_INVENTORY_WITH_RESERVATIONS') }),
	z.object({ code: z.literal('INVALID_PRODUCT_VARIANT') }),
	z.object({ code: z.literal('PRODUCT_VARIANT_SKU_TAKEN') }),
	z.object({ code: z.literal('PRODUCT_VARIANT_STOCK_BELOW_RESERVED') }),
	z.object({ code: z.literal('CANNOT_DELETE_RESERVED_PRODUCT_VARIANT') }),
	z.object({ code: z.literal('DUPLICATE_PRODUCT_VARIANT_OPTION') }),
	z.object({ code: z.literal('INVALID_PRODUCT_VARIANT_IMAGE') }),
	z.object({ code: z.literal('DUPLICATE_PRODUCT_VARIANT') }),
	z.object({ code: z.literal('INVALID_ORDER_DATA') }),
	z.object({ code: z.literal('ORDER_PRODUCT_UNAVAILABLE') }),
	z.object({ code: z.literal('CHECKOUT_RESERVATION_NOT_FOUND') }),
	z.object({ code: z.literal('CHECKOUT_RESERVATION_CONFLICT') }),
	z.object({ code: z.literal('ORDER_RETRY_CONFLICT') }),
	z.object({ code: z.literal('ORDER_NOT_FOUND') }),
	z.object({ code: z.literal('ORDER_PAYMENT_UNAVAILABLE') }),
	z.object({ code: z.literal('ORDER_PAYMENT_REQUIRED') }),
	z.object({ code: z.literal('ORDER_REFUND_UNAVAILABLE') }),
	z.object({ code: z.literal('ORDER_REFUND_FAILED') }),
	z.object({ code: z.literal('ORDER_CANCELLED') }),
	z.object({ code: z.literal('INVALID_CATEGORY_DATA') }),
	z.object({ code: z.literal('CATEGORY_NOT_FOUND') }),
	z.object({ code: z.literal('CATEGORY_SLUG_TAKEN') }),
	z.object({
		code: z.literal('CATEGORY_HAS_PRODUCTS'),
		productNames: z.array(z.string()),
		productCount: z.number()
	}),
	z.object({ code: z.literal('INVALID_RETAINED_IMAGE') }),
	z.object({ code: z.literal('DUPLICATE_RETAINED_IMAGE') }),
	z.object({ code: z.literal('DUPLICATE_UPLOAD_KEY') }),
	z.object({ code: z.literal('UPLOAD_NOT_FOUND') }),
	z.object({ code: z.literal('INVALID_UPLOAD_NAMESPACE') }),
	z.object({ code: z.literal('INVALID_UPLOAD') }),
	z.object({ code: z.literal('UPLOAD_BATCH_TOO_LARGE'), maxSizeMB: z.number() })
]);

export type BackendErrorData = z.infer<typeof backendErrorDataSchema>;
