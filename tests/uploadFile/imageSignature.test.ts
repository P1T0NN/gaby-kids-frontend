import { expect, test } from 'vitest';

import { detectImageContentType } from '../../src/convex/storage/r2';

test('WebP detection preserves byte offsets across binary RIFF sizes', () => {
	for (const size of [
		[0xc2, 0x80, 0, 0],
		[0xe0, 0xa0, 0x80, 0],
		[0xff, 0xff, 0, 0]
	]) {
		const header = Uint8Array.from([82, 73, 70, 70, ...size, 87, 69, 66, 80]);
		expect(detectImageContentType(header)).toBe('image/webp');
		expect(detectImageContentType(header.subarray(0, 11))).toBeUndefined();
		header[8] = 0;
		expect(detectImageContentType(header)).toBeUndefined();
	}
});

test('other supported signatures remain accepted and unknown bytes are rejected', () => {
	for (const signature of ['GIF87a', 'GIF89a']) {
		expect(detectImageContentType(new TextEncoder().encode(signature))).toBe('image/gif');
	}
	expect(detectImageContentType(Uint8Array.from([0xff, 0xd8, 0xff]))).toBe('image/jpeg');
	expect(detectImageContentType(Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]))).toBe(
		'image/png'
	);
	expect(detectImageContentType(new Uint8Array())).toBeUndefined();
	expect(detectImageContentType(new TextEncoder().encode('RIFF1234WAVE'))).toBeUndefined();
});
