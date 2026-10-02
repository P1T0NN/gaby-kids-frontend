// @vitest-environment node
import sharp from 'sharp';
import { expect, test } from 'vitest';
import { optimizeToWebp } from '../../src/features/storage/server/optimizeToWebp.js';

test('server decodes originals, pads without cropping, resizes and strips metadata', async () => {
	for (const format of ['jpeg', 'png', 'webp'] as const) {
		const original = await sharp({
			create: { width: 2400, height: 1200, channels: 3, background: 'red' }
		})
			.toFormat(format)
			.withMetadata()
			.toBuffer();
		const output = await optimizeToWebp(original);
		const metadata = await sharp(output).metadata();
		expect(metadata).toMatchObject({ format: 'webp', width: 1920, height: 1920 });
		expect(metadata.exif).toBeUndefined();
		expect(output.byteLength).toBeLessThanOrEqual(2 * 1024 * 1024);
		const { data, info } = await sharp(output).raw().toBuffer({ resolveWithObject: true });
		expect([...data.subarray(0, 3)]).toEqual([255, 255, 255]);
		const center = (960 * info.width + 960) * info.channels;
		expect(data[center]).toBeGreaterThan(240);
		expect(data[center + 1]).toBeLessThan(15);
	}
});

test('server rejects invalid, oversized, excessive-pixel and SVG inputs', async () => {
	const tooManyPixels = await sharp({
		create: { width: 6500, height: 6500, channels: 3, background: 'white' }
	})
		.png()
		.toBuffer();
	for (const bytes of [
		new Uint8Array(0),
		new Uint8Array(20 * 1024 * 1024 + 1),
		new TextEncoder().encode('RIFF0000WEBP invalid image'),
		new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>'),
		tooManyPixels
	]) {
		await expect(optimizeToWebp(bytes)).rejects.toMatchObject({ data: { code: 'INVALID_UPLOAD' } });
	}
});
