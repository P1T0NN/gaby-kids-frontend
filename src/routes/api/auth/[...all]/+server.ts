// LIBRARIES
import type { RequestHandler } from '@sveltejs/kit';
import { PUBLIC_CONVEX_SITE_URL } from '$env/static/public';

const AUTH_CLIENT_IP_HEADER = 'x-better-auth-client-ip';
const FORWARDED_AUTH_HEADER_NAMES = new Set([
	'accept',
	'authorization',
	'better-auth-cookie',
	'content-type',
	'cookie',
	'origin',
	'referer',
	'user-agent',
	'x-captcha-response'
]);

const handler: RequestHandler = ({ request, getClientAddress }) => {
	const requestUrl = new URL(request.url);
	if (!PUBLIC_CONVEX_SITE_URL) {
		throw new Error('PUBLIC_CONVEX_SITE_URL environment variable is not set');
	}

	const nextUrl = `${PUBLIC_CONVEX_SITE_URL}${requestUrl.pathname}${requestUrl.search}`;
	const clientIp = getClientAddress();
	const forwardedHeaders = new Headers();

	for (const [headerName, headerValue] of request.headers.entries()) {
		if (FORWARDED_AUTH_HEADER_NAMES.has(headerName.toLowerCase())) {
			forwardedHeaders.set(headerName, headerValue);
		}
	}

	// Convex can replace X-Forwarded-For with its own server address. Better Auth
	// reads this private header, which is set here from the trusted provider value.
	if (clientIp) forwardedHeaders.set(AUTH_CLIENT_IP_HEADER, clientIp);

	forwardedHeaders.set('host', new URL(nextUrl).host);
	forwardedHeaders.set('x-forwarded-host', requestUrl.host);
	forwardedHeaders.set('x-forwarded-proto', requestUrl.protocol.replace(/:$/, ''));
	forwardedHeaders.set('x-better-auth-forwarded-host', requestUrl.host);
	forwardedHeaders.set('x-better-auth-forwarded-proto', requestUrl.protocol.replace(/:$/, ''));
	forwardedHeaders.set('accept-encoding', 'identity');

	const newRequest = new Request(nextUrl, request);
	for (const headerName of Array.from(newRequest.headers.keys())) {
		newRequest.headers.delete(headerName);
	}
	for (const [headerName, headerValue] of forwardedHeaders.entries()) {
		newRequest.headers.set(headerName, headerValue);
	}

	return fetch(newRequest, { method: request.method, redirect: 'manual' });
};

export const GET = handler;
export const POST = handler;
