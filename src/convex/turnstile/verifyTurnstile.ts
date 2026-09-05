// LIBRARIES
import { ConvexError } from 'convex/values';

// CONFIG
import {
	MAX_TOKEN_LENGTH,
	SITEVERIFY_URL,
	TURNSTILE_ALWAYS_PASS_TEST_SECRET
} from '../../shared/features/captcha/config.js';

// SCHEMAS
import { turnstileResponseSchema } from '../../shared/features/captcha/schemas/captchaSchemas.js';

// TYPES
import type { BackendErrorData } from '../../shared/types/types.js';

export async function verifyTurnstileToken(
	token: string,
	expectedAction: string,
	secretKey = process.env.TURNSTILE_SECRET_KEY,
	fetcher: typeof fetch = fetch
): Promise<void> {
	if (!secretKey) throw new Error('TURNSTILE_SECRET_KEY is missing');
	const hasInvalidToken = !token || token.length > MAX_TOKEN_LENGTH;
	if (hasInvalidToken) {
		throw new ConvexError<BackendErrorData>({ code: 'CAPTCHA_FAILED' });
	}
	if (secretKey === TURNSTILE_ALWAYS_PASS_TEST_SECRET) return;

	const response = await fetcher(SITEVERIFY_URL, {
		method: 'POST',
		headers: { 'content-type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({ secret: secretKey, response: token })
	});
	if (!response.ok) throw new Error(`Turnstile Siteverify failed with ${response.status}`);

	const result = turnstileResponseSchema.safeParse(await response.json());
	const hasInvalidVerification =
		!result.success || !result.data.success || result.data.action !== expectedAction;
	if (hasInvalidVerification) {
		throw new ConvexError<BackendErrorData>({ code: 'CAPTCHA_FAILED' });
	}
}
