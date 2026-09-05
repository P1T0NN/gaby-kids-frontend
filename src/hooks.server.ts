// LIBRARIES
import { withServerConvexToken } from 'convex-svelte/sveltekit/server';
import { getToken } from '@mmailaender/convex-better-auth-svelte/sveltekit';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { getTextDirection } from '$lib/paraglide/runtime';

// TYPES
import type { HandleServerError, HandleValidationError } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;
		const token = getToken(event.cookies);
		event.locals.token = token;

		return withServerConvexToken(token, () =>
			resolve(event, {
				transformPageChunk: ({ html }) =>
					html.replace('%lang%', locale).replace('%dir%', getTextDirection(locale))
			})
		);
	});

// Unexpected errors — log/report the real thing, return a sanitized App.Error so
// internals and stack traces never reach the client. Expected errors (thrown via
// `error()`) skip this hook entirely.
export const handleError: HandleServerError = ({ error, status, message }) => {
	console.error(`[handleError] ${status} ${message}`, error);
	return { message: 'Internal Error' };
};

// Remote-function argument validation failures — keep the generic 400 message
// so we don't help attackers probing the exposed endpoints.
export const handleValidationError: HandleValidationError = () => ({ message: 'Invalid request' });
