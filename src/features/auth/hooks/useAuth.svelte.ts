// SVELTEKIT IMPORTS
import { gotoParaglide } from '@/utils/gotoParaglide.js';

// LIBRARIES
import { authClient } from '../lib/authClient';

// COMPONENTS
import { toast } from 'svelte-sonner';

// CONSTANTS
import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints';

// UTILS
import { toErrorCode } from '@/shared/utils/toErrorCode';

// DATA
import { SERVER_MESSAGE_TO_CODE } from '@/shared/features/auth/data/authData';

// TYPES
import type { SignUpErrorCode } from '@/shared/features/auth/types/authTypes';

type AuthResult = { error?: { code?: string; message?: string } | null } | null | undefined;

/**
 * Shared submit plumbing for the auth forms — owns `error`/`submitting` state,
 * wraps every better-auth call in the same try/finally, and maps server messages
 * to codes. Keep the returned object: destructuring the getters snapshots them.
 */
export function useAuth() {
	let error = $state<SignUpErrorCode | null>(null);
	let submitting = $state(false);

	/** Set a local (client-side) error code, e.g. the confirm-password check. */
	function setError(code: SignUpErrorCode) {
		error = code;
	}

	function setErrorFrom(message: string | undefined) {
		error = toErrorCode(message ?? '', SERVER_MESSAGE_TO_CODE, 'SOMETHING_WENT_WRONG');
	}

	function captchaFetchOptions(captchaToken: string) {
		return { fetchOptions: { headers: { 'x-captcha-response': captchaToken } } };
	}

	async function run(action: () => Promise<AuthResult>, onSuccess?: () => void) {
		error = null;
		submitting = true;
		try {
			const result = await action();
			if (result?.error) {
				if (result.error.code === 'BANNED_USER') {
					// eslint-disable-next-line svelte/prefer-svelte-reactivity
					const params = new URLSearchParams({ error: 'BANNED_USER' });
					if (result.error.message) params.set('error_description', result.error.message);
					// eslint-disable-next-line svelte/no-navigation-without-resolve
					await gotoParaglide(`${UNPROTECTED_PAGE_ENDPOINTS.AUTH_ERROR}?${params}`);
					return;
				}

				setErrorFrom(result.error.message);
			} else {
				// Endpoints that return a redirect url navigate themselves via the redirect
				// plugin; the OTP flows don't, so callers can pass an onSuccess (e.g. gotoParaglide).
				onSuccess?.();
			}
		} finally {
			submitting = false;
		}
	}

	return {
		get error() {
			return error;
		},
		get submitting() {
			return submitting;
		},
		setError,
		signInWithEmail(email: string, password: string, captchaToken: string) {
			return run(() =>
				authClient.signIn.email({
					...captchaFetchOptions(captchaToken),
					email,
					password,
					callbackURL: UNPROTECTED_PAGE_ENDPOINTS.ROOT
				})
			);
		},
		// successMessage is authored by the calling .svelte (CodingRules: no text in utils).
		signUpWithEmail(
			email: string,
			password: string,
			name: string,
			successMessage: string,
			captchaToken: string
		) {
			return run(
				() =>
					authClient.signUp.email({
						...captchaFetchOptions(captchaToken),
						email,
						password,
						name
					}),
				() => {
					// Server returns the SAME success for new accounts and existing emails
					// (anti-enumeration), so both cases take this path: toast + OTP page.
					// No callbackURL on purpose — the redirect plugin does a full page reload,
					// which would drop the toast.
					toast.success(successMessage);
					// eslint-disable-next-line svelte/no-navigation-without-resolve
					gotoParaglide(`${UNPROTECTED_PAGE_ENDPOINTS.VERIFY_EMAIL}?email=${encodeURIComponent(email)}`);
				}
			);
		},
		sendVerificationOtp(email: string, captchaToken: string) {
			return run(() =>
				authClient.emailOtp.sendVerificationOtp({
					...captchaFetchOptions(captchaToken),
					email,
					type: 'email-verification'
				})
			);
		},
		verifyEmail(email: string, otp: string, captchaToken: string) {
			return run(
				() => authClient.emailOtp.verifyEmail({ ...captchaFetchOptions(captchaToken), email, otp }),
				() => gotoParaglide(UNPROTECTED_PAGE_ENDPOINTS.ROOT)
			);
		},
		requestPasswordReset(email: string, captchaToken: string) {
			return run(() =>
				authClient.emailOtp.requestPasswordReset({ ...captchaFetchOptions(captchaToken), email })
			);
		},
		resetPassword(email: string, otp: string, password: string, captchaToken: string) {
			return run(
				() =>
					authClient.emailOtp.resetPassword({
						...captchaFetchOptions(captchaToken),
						email,
						otp,
						password
					}),
				() => gotoParaglide(UNPROTECTED_PAGE_ENDPOINTS.SIGN_IN)
			);
		},
		signInWithGoogle(captchaToken: string) {
			return run(() =>
				authClient.signIn.social({
					...captchaFetchOptions(captchaToken),
					provider: 'google',
					callbackURL: UNPROTECTED_PAGE_ENDPOINTS.ROOT,
					errorCallbackURL: UNPROTECTED_PAGE_ENDPOINTS.AUTH_ERROR
				})
			);
		}
	};
}
