// UTILS
import { toastMessage } from '@/utils/toastMessage.js';

/** The shape better-auth client calls resolve to on failure. */
export type AuthActionResult =
	{ error?: { code?: string; message?: string } | null } | null | undefined;

/**
 * Run a better-auth client call: toast the caller-authored success/error copy and
 * report whether it succeeded. Never throws — unexpected errors become a toast.
 */
export async function runAuthAction(
	action: () => Promise<AuthActionResult>,
	successMessage: string,
	errorMessage: string
): Promise<boolean> {
	try {
		const result = await action();
		if (result?.error) {
			toastMessage({ type: 'error', error: result.error, message: errorMessage });
			return false;
		}

		toastMessage({ type: 'success', message: successMessage });
		return true;
	} catch (error) {
		toastMessage({ type: 'error', error, message: errorMessage });
		return false;
	}
}
