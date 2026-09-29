// LIBRARIES
import imageCompression from 'browser-image-compression';

// CONFIG
import { STORAGE_CLIENT_OPTIMIZE_CONFIG } from '@/shared/features/storage/config';

// TYPES
import type { ClientOptimizeOptions } from '@/shared/features/storage/types/storageTypes';

/**
 * Client-side image optimization — compress + re-encode to WebP in the browser,
 * then fit the configured aspect ratio by padding (never cropping).
 * Throws on failure; callers decide whether to abort or fall back to the original.
 */
export async function optimizeToWebp(
	file: File,
	options: ClientOptimizeOptions = {}
): Promise<File> {
	const { maxWidthOrHeight, maxSizeMB, quality, aspectRatio, background } = {
		...STORAGE_CLIENT_OPTIMIZE_CONFIG,
		...options
	};

	const optimized = await imageCompression(file, {
		maxSizeMB,
		maxWidthOrHeight,
		initialQuality: quality,
		fileType: 'image/webp',
		useWebWorker: true
	});

	// browser-image-compression keeps the original name — drop the old extension
	const base = file.name.replace(/\.(jpe?g|png|gif|bmp|avif|webp)$/i, '');

	const fitted =
		aspectRatio === undefined
			? optimized
			: await fitToAspectRatio(optimized, aspectRatio, background ?? '#ffffff', quality).catch(
					() => optimized
				);

	return new File([fitted], `${base || 'image'}.webp`, { type: 'image/webp' });
}

/** Draws the image "contain"-fit and centered on a canvas of the target ratio. */
async function fitToAspectRatio(
	file: File,
	aspectRatio: number,
	background: string,
	quality: number | undefined
): Promise<File> {
	const bitmap = await createImageBitmap(file);

	try {
		const width = Math.round(Math.max(bitmap.width, bitmap.height * aspectRatio));
		const height = Math.round(width / aspectRatio);
		if (width === bitmap.width && height === bitmap.height) return file;

		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;

		const context = canvas.getContext('2d');
		if (!context) return file;

		context.fillStyle = background;
		context.fillRect(0, 0, width, height);
		context.imageSmoothingQuality = 'high';

		const scale = Math.min(width / bitmap.width, height / bitmap.height);
		const drawWidth = bitmap.width * scale;
		const drawHeight = bitmap.height * scale;
		context.drawImage(
			bitmap,
			(width - drawWidth) / 2,
			(height - drawHeight) / 2,
			drawWidth,
			drawHeight
		);

		const blob = await new Promise<Blob | null>((resolve) =>
			canvas.toBlob(resolve, 'image/webp', quality)
		);
		return blob ? new File([blob], file.name, { type: 'image/webp' }) : file;
	} finally {
		bitmap.close();
	}
}
