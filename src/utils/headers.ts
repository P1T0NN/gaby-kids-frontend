// TYPES
// Client IP header precedence:
// Cloudflare: cf-connecting-ip
// Vercel: x-vercel-forwarded-for
// Fallback: x-forwarded-for
// Never use generic x-real-ip.

import type { RequestMetadata } from '@/types/types.js';

const first = (headers: Headers, ...names: string[]): string | null => {
	for (const name of names) {
		const value = headers.get(name);
		if (value) return value;
	}
	return null;
};

const firstValue = <Key extends keyof RequestMetadata>(
	key: Key,
	...sources: Partial<RequestMetadata>[]
): string | null => {
	for (const source of sources) {
		const value = source[key];
		if (value) return value;
	}
	return null;
};

const forwardedIp = (headers: Headers): string | null =>
	headers.get('x-forwarded-for')?.split(',', 1)[0]?.trim() || null;

/** Extract normalized metadata supplied by Cloudflare. */
export function getCloudflareMetadata(headers: Headers): Partial<RequestMetadata> {
	return {
		// CF-Connecting-IP is canonical; True-Client-IP is an equivalent legacy/Enterprise fallback. Trust only Cloudflare-origin traffic.
		ipAddress: first(headers, 'cf-connecting-ip', 'true-client-ip'),
		country: headers.get('cf-ipcountry'),
		region: first(headers, 'cf-region-code', 'cf-region'),
		city: headers.get('cf-ipcity'),
		timezone: headers.get('cf-timezone'),
		latitude: headers.get('cf-iplatitude'),
		longitude: headers.get('cf-iplongitude'),
		requestId: headers.get('cf-ray')
	};
}

/** Extract normalized metadata supplied by Vercel. */
export function getVercelMetadata(headers: Headers): Partial<RequestMetadata> {
	return {
		// Vercel's provider-specific client-IP header; prefer it over generic X-Forwarded-For when Vercel terminates the request.
		ipAddress: headers.get('x-vercel-forwarded-for'),
		country: headers.get('x-vercel-ip-country'),
		region: headers.get('x-vercel-ip-country-region'),
		city: headers.get('x-vercel-ip-city'),
		timezone: headers.get('x-vercel-ip-timezone'),
		latitude: headers.get('x-vercel-ip-latitude'),
		longitude: headers.get('x-vercel-ip-longitude'),
		requestId: headers.get('x-vercel-id')
	};
}

const getStandardMetadata = (headers: Headers): Partial<RequestMetadata> => ({
	// Generic X-Forwarded-For is only a fallback; it is client-controlled unless the immediate proxy is trusted.
	ipAddress: forwardedIp(headers),
	userAgent: headers.get('user-agent'),
	acceptLanguage: headers.get('accept-language'),
	referer: headers.get('referer'),
	origin: headers.get('origin'),
	host: first(headers, 'x-forwarded-host', 'host'),
	protocol: headers.get('x-forwarded-proto')
});

/** Merge provider-specific and standard request headers into one stable shape. */
export function getRequestMetadata(headers: Headers): RequestMetadata {
	const cloudflare = getCloudflareMetadata(headers);
	const vercel = getVercelMetadata(headers);
	const standard = getStandardMetadata(headers);

	return {
		ipAddress: firstValue('ipAddress', cloudflare, vercel, standard),
		userAgent: firstValue('userAgent', cloudflare, vercel, standard),
		acceptLanguage: firstValue('acceptLanguage', cloudflare, vercel, standard),
		referer: firstValue('referer', cloudflare, vercel, standard),
		origin: firstValue('origin', cloudflare, vercel, standard),
		host: firstValue('host', cloudflare, vercel, standard),
		protocol: firstValue('protocol', cloudflare, vercel, standard),
		country: firstValue('country', cloudflare, vercel, standard),
		region: firstValue('region', cloudflare, vercel, standard),
		city: firstValue('city', cloudflare, vercel, standard),
		timezone: firstValue('timezone', cloudflare, vercel, standard),
		latitude: firstValue('latitude', cloudflare, vercel, standard),
		longitude: firstValue('longitude', cloudflare, vercel, standard),
		requestId: firstValue('requestId', cloudflare, vercel, standard)
	};
}
