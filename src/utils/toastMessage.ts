// LIBRARIES
import { isRateLimitError } from '@convex-dev/rate-limiter';

// COMPONENTS
import { toast } from 'svelte-sonner';
import { m } from '@/lib/paraglide/messages';

// UTILS
import { getBackendErrorMessage } from '@/utils/getBackendErrorMessage.js';

type ToastSuccessMessage = {
	type: 'success';
	message: string;
	toasterId?: string;
};

type ToastErrorMessage<ErrorValue> = {
	type: 'error';
	error: ErrorValue;
	message: string;
};

type ToastMessageRequest<ErrorValue> = ToastSuccessMessage | ToastErrorMessage<ErrorValue>;

/** Route toast display while keeping all user-facing wording in the calling component. */
export function toastMessage<ErrorValue>(request: ToastMessageRequest<ErrorValue>): void {
	if (request.type === 'success') {
		toast.success(
			request.message,
			request.toasterId ? { toasterId: request.toasterId } : undefined
		);
		return;
	}

	if (isRateLimitError(request.error)) {
		const seconds = Math.max(1, Math.ceil(request.error.data.retryAfter / 1000));
		toast.error(
			seconds === 1
				? m['BackendMessages.rateLimitSingle']()
				: m['BackendMessages.rateLimitMultiple']({ seconds })
		);
		return;
	}

	toast.error(
		(request.error instanceof Error ? getBackendErrorMessage(request.error) : undefined) ??
			request.message
	);
}
