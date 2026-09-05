import { describe, expect, it } from 'vitest';
import {
	getCloudflareMetadata,
	getRequestMetadata,
	getVercelMetadata
} from '../../src/utils/headers.js';

describe('getRequestMetadata', () => {
	it('prefers provider headers and reads standard request metadata', () => {
		const metadata = getRequestMetadata(
			new Headers({
				'cf-connecting-ip': '203.0.113.10',
				'x-forwarded-for': '198.51.100.1, 198.51.100.2',
				'cf-ipcountry': 'FR',
				'user-agent': 'Example Browser',
				host: 'example.com'
			})
		);

		expect(metadata).toMatchObject({
			ipAddress: '203.0.113.10',
			userAgent: 'Example Browser',
			country: 'FR',
			host: 'example.com'
		});
	});

	it('uses the first forwarded address as the generic fallback', () => {
		const metadata = getRequestMetadata(
			new Headers({ 'x-forwarded-for': '203.0.113.20, 198.51.100.2' })
		);

		expect(metadata.ipAddress).toBe('203.0.113.20');
	});

	it('does not use generic x-real-ip as a client IP source', () => {
		const metadata = getRequestMetadata(new Headers({ 'x-real-ip': '203.0.113.21' }));

		expect(metadata.ipAddress).toBeNull();
	});

	it('extracts Vercel metadata and merges it with standard headers', () => {
		const headers = new Headers({
			'x-vercel-forwarded-for': '203.0.113.30',
			'x-vercel-ip-country': 'DE',
			'x-vercel-ip-city': 'Berlin',
			'x-vercel-id': 'fra1::abc',
			'user-agent': 'Example Browser'
		});

		expect(getVercelMetadata(headers)).toMatchObject({
			ipAddress: '203.0.113.30',
			country: 'DE',
			city: 'Berlin',
			requestId: 'fra1::abc'
		});
		expect(getRequestMetadata(headers)).toMatchObject({
			ipAddress: '203.0.113.30',
			userAgent: 'Example Browser',
			country: 'DE'
		});
	});

	it('lets Cloudflare metadata win when both providers are present', () => {
		const headers = new Headers({
			'cf-connecting-ip': '203.0.113.40',
			'cf-ray': 'ray-id',
			'x-vercel-forwarded-for': '203.0.113.41',
			'x-vercel-id': 'vercel-id',
			'x-forwarded-proto': 'https'
		});

		expect(getCloudflareMetadata(headers)).toMatchObject({
			ipAddress: '203.0.113.40',
			requestId: 'ray-id'
		});
		expect(getRequestMetadata(headers)).toMatchObject({
			ipAddress: '203.0.113.40',
			protocol: 'https',
			requestId: 'ray-id'
		});
	});
});
