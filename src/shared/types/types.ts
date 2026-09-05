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
	z.object({ code: z.literal('PRODUCT_SLUG_TAKEN') }),
	z.object({ code: z.literal('PRODUCT_DELETE_RESTRICTED') }),
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
	z.object({ code: z.literal('TOO_MANY_FILES'), maxFiles: z.number() })
]);

export type BackendErrorData = z.infer<typeof backendErrorDataSchema>;
