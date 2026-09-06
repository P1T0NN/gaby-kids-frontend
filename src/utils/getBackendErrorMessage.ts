// LIBRARIES
import { ConvexError } from 'convex/values';

// COMPONENTS
import { m } from '../lib/paraglide/messages.js';

// TYPES
import { backendErrorDataSchema } from '../shared/types/types.js';

export function getBackendErrorMessage(error: Error): string | undefined {
	if (!(error instanceof ConvexError)) return;
	const parsed = backendErrorDataSchema.safeParse(error.data);
	if (!parsed.success) return;

	switch (parsed.data.code) {
		case 'UNAUTHENTICATED':
			return m['BackendMessages.unauthenticated']();
		case 'FORBIDDEN':
			return m['BackendMessages.forbidden']();
		case 'CAPTCHA_FAILED':
			return m['BackendMessages.captchaFailed']();
		case 'INVALID_PRODUCT_DATA':
			return m['BackendMessages.invalidProductData']();
		case 'PRODUCT_NOT_FOUND':
			return m['BackendMessages.productNotFound']();
		case 'PRODUCT_SLUG_TAKEN':
			return m['BackendMessages.productSlugTaken']();
		case 'PRODUCT_DELETE_RESTRICTED':
			return m['BackendMessages.productDeleteRestricted']();
		case 'INVALID_ORDER_DATA':
			return m['BackendMessages.invalidOrderData']();
		case 'ORDER_PRODUCT_UNAVAILABLE':
			return m['BackendMessages.orderProductUnavailable']();
		case 'ORDER_RETRY_CONFLICT':
			return m['BackendMessages.orderRetryConflict']();
		case 'ORDER_NOT_FOUND':
			return m['BackendMessages.orderNotFound']();
		case 'ORDER_PAYMENT_REQUIRED':
			return m['BackendMessages.orderPaymentRequired']();
		case 'ORDER_REFUND_UNAVAILABLE':
			return m['BackendMessages.orderRefundUnavailable']();
		case 'ORDER_CANCELLED':
			return m['BackendMessages.orderCancelled']();
		case 'INVALID_CATEGORY_DATA':
			return m['BackendMessages.invalidCategoryData']();
		case 'CATEGORY_NOT_FOUND':
			return m['BackendMessages.categoryNotFound']();
		case 'CATEGORY_SLUG_TAKEN':
			return m['BackendMessages.categorySlugTaken']();
		case 'CATEGORY_HAS_PRODUCTS':
			return m['BackendMessages.categoryHasProducts']({
				productNames: parsed.data.productNames.join(', '),
				productCount: parsed.data.productCount
			});
		case 'INVALID_RETAINED_IMAGE':
			return m['BackendMessages.invalidRetainedImage']();
		case 'DUPLICATE_RETAINED_IMAGE':
			return m['BackendMessages.duplicateRetainedImage']();
		case 'DUPLICATE_UPLOAD_KEY':
			return m['BackendMessages.duplicateUploadKey']();
		case 'UPLOAD_NOT_FOUND':
			return m['BackendMessages.uploadNotFound']();
		case 'INVALID_UPLOAD_NAMESPACE':
			return m['BackendMessages.invalidUploadNamespace']();
		case 'INVALID_UPLOAD':
			return m['BackendMessages.invalidUpload']();
		case 'TOO_MANY_FILES':
			return m['BackendMessages.tooManyFiles']({ maxFiles: parsed.data.maxFiles });
	}
}
