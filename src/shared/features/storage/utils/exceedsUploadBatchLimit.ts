import { STORAGE_CONFIG } from '../config.js';

export function exceedsUploadBatchLimit(sizes: readonly number[]): boolean {
	return sizes.reduce((total, size) => total + size, 0) > STORAGE_CONFIG.maxTotalUploadBytes;
}
