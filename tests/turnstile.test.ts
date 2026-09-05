// LIBRARIES
import { ConvexError } from 'convex/values';
import { describe, expect, test, vi } from 'vitest';

// UTILS
import { verifyTurnstileToken } from '../src/convex/turnstile/verifyTurnstile.js';
import { TURNSTILE_ALWAYS_PASS_TEST_SECRET } from '../src/shared/features/captcha/config.js';

describe('verifyTurnstileToken', () => {
	test('accepts only a successful response with the expected action', async () => {
		const fetcher = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(Response.json({ success: true, action: 'test_action' }))
			.mockResolvedValueOnce(Response.json({ success: true, action: 'auth' }));

		await expect(
			verifyTurnstileToken('valid-token', 'test_action', 'test-secret', fetcher)
		).resolves.toBeUndefined();
		await expect(
			verifyTurnstileToken('wrong-action', 'test_action', 'test-secret', fetcher)
		).rejects.toBeInstanceOf(ConvexError);

		expect(fetcher).toHaveBeenCalledTimes(2);
	});

	test('accepts Cloudflare dummy tokens only with the official test secret', async () => {
		const fetcher = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(Response.json({ success: true, action: 'test' }));

		await expect(
			verifyTurnstileToken(
				'XXXX.DUMMY.TOKEN.XXXX',
				'test_action',
				TURNSTILE_ALWAYS_PASS_TEST_SECRET,
				fetcher
			)
		).resolves.toBeUndefined();
		await expect(
			verifyTurnstileToken('XXXX.DUMMY.TOKEN.XXXX', 'test_action', 'production-secret', fetcher)
		).rejects.toBeInstanceOf(ConvexError);
		expect(fetcher).toHaveBeenCalledOnce();
	});
});
