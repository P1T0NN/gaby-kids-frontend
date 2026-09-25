import { expect, test } from 'vitest';

import {
	exceedsUploadBatchLimit,
	STORAGE_CONFIG
} from '../src/shared/features/storage/config.js';

test('limits combined image bytes without limiting image count', () => {
	const maxBytes = STORAGE_CONFIG.maxTotalUploadBytes;

	expect(exceedsUploadBatchLimit([maxBytes])).toBe(false);
	expect(exceedsUploadBatchLimit([maxBytes / 2, maxBytes / 2])).toBe(false);
	expect(exceedsUploadBatchLimit(Array.from({ length: 11 }, () => 1))).toBe(false);
	expect(exceedsUploadBatchLimit([maxBytes, 1])).toBe(true);
});
