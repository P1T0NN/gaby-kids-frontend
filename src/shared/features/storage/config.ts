// All storage tuning knobs live here.

export const STORAGE_OPTIMIZE_CONFIG = {
	maxWidthOrHeight: 1920,
	maxSizeMB: 2,
	quality: 0.8,
	/** Uploads are normalized to the display frame ratio (square product images). */
	background: '#ffffff'
} as const;

/** Object storage. */
export const STORAGE_CONFIG = {
	/** Hard boundary for the total bytes transferred in one form submission (50 MiB). */
	maxTotalUploadBytes: 50 * 1024 * 1024,
	/** Hard boundary for one original image (20 MiB). */
	maxFileSizeBytes: 20 * 1024 * 1024,
	/** Bound decompression memory before decoding untrusted originals. */
	maxInputPixels: 40_000_000,
	allowedImageTypes: [
		'image/jpeg',
		'image/png',
		'image/webp',
		'image/gif',
		'image/avif',
		'image/tiff'
	],
	/** Signed PUT URLs are short-lived; cleanup records outlive their expiry. */
	uploadUrlExpiresSeconds: 300,
	/** How many abandoned uploads one cleanup run removes. */
	cleanupBatchSize: 100,
	/** How often Convex removes abandoned uploads. */
	cleanupIntervalMinutes: 5,
	/** Failed or abandoned submissions remain retryable until this age. */
	uploadTtlMinutes: 60
} as const;
