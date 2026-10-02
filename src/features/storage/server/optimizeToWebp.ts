// LIBRARIES
import sharp from 'sharp';
import { ConvexError } from 'convex/values';

// CONFIG
import {
	STORAGE_OPTIMIZE_CONFIG,
	STORAGE_CONFIG
} from '../../../shared/features/storage/config.js';

// TYPES
import type { BackendErrorData } from '../../../shared/types/types.js';

/** Decode untrusted originals and produce a bounded WebP before storing anything. */
export async function optimizeToWebp(bytes: Uint8Array): Promise<Buffer> {
	const invalidSize = bytes.byteLength === 0 || bytes.byteLength > STORAGE_CONFIG.maxFileSizeBytes;
	if (invalidSize) throw new ConvexError<BackendErrorData>({ code: 'INVALID_UPLOAD' });

	try {
		const image = sharp(Buffer.from(bytes), {
			limitInputPixels: STORAGE_CONFIG.maxInputPixels,
			failOn: 'warning'
		});
		const metadata = await image.metadata();
		const supportedFormat = ['jpeg', 'png', 'webp', 'gif', 'avif', 'heif', 'tiff'].includes(
			metadata.format ?? ''
		);
		if (!supportedFormat || !metadata.width || !metadata.height) {
			throw new Error('Unsupported image');
		}
		const { maxWidthOrHeight, background, quality, maxSizeMB } = STORAGE_OPTIMIZE_CONFIG;
		const side = Math.min(maxWidthOrHeight, Math.max(metadata.width, metadata.height));
		const resized = image
			.autoOrient()
			.resize({ width: side, height: side, fit: 'contain', background });
		for (let outputQuality = Math.round(quality * 100); outputQuality >= 35; outputQuality -= 15) {
			const output = await resized.clone().webp({ quality: outputQuality }).toBuffer();
			if (output.byteLength <= maxSizeMB * 1024 * 1024) return output;
		}
	} catch {
		throw new ConvexError<BackendErrorData>({ code: 'INVALID_UPLOAD' });
	}
	throw new ConvexError<BackendErrorData>({ code: 'INVALID_UPLOAD' });
}
