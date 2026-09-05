import { describe, expect, it } from 'vitest';
import { aggregateUploadProgress } from '../../src/features/uploadFile/utils/aggregateUploadProgress.js';

describe('aggregateUploadProgress', () => {
	it('weights progress by file size', () => {
		expect(
			aggregateUploadProgress([
				{ loaded: 25, total: 100 },
				{ loaded: 100, total: 100 }
			])
		).toBe(63);
	});
});
