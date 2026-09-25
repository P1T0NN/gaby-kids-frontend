// TYPES
import type { ClientOptimizeOptions } from './types/storageTypes';

// All storage tuning knobs live here.

export const STORAGE_CLIENT_OPTIMIZE_CONFIG = {
	maxWidthOrHeight: 1920,
	maxSizeMB: 2,
	quality: 0.8
} satisfies ClientOptimizeOptions;

/** Object storage. */
export const STORAGE_CONFIG = {
	/** Hard boundary for the total bytes transferred in one form submission (50 MiB). */
	maxTotalUploadBytes: 50 * 1024 * 1024,
	/** Hard server boundary for one stored file (20 MiB). */
	maxFileSizeBytes: 20 * 1024 * 1024,
	/** File signatures accepted by the server. */
	allowedImageTypes: ['image/gif', 'image/jpeg', 'image/png', 'image/webp'],
	/** How many abandoned uploads one cleanup run removes. */
	cleanupBatchSize: 100,
	/** How often Convex removes abandoned uploads. */
	cleanupIntervalMinutes: 5,
	/** Failed or abandoned submissions remain retryable until this age. */
	uploadTtlMinutes: 60
} as const;

export function exceedsUploadBatchLimit(sizes: readonly number[]): boolean {
	return sizes.reduce((total, size) => total + size, 0) > STORAGE_CONFIG.maxTotalUploadBytes;
}
