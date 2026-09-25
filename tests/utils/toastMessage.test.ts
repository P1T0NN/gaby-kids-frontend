import { ConvexError } from 'convex/values';
import { expect, test } from 'vitest';

import { overwriteGetLocale } from '../../src/lib/paraglide/runtime.js';
import { getBackendErrorMessage } from '../../src/utils/getBackendErrorMessage.js';

test('translates known backend error codes and ignores unknown errors', () => {
	overwriteGetLocale(() => 'en');
	expect(
		getBackendErrorMessage(
			new ConvexError({ code: 'UPLOAD_BATCH_TOO_LARGE', maxSizeMB: 50 })
		)
	).toBe('The combined image upload cannot exceed 50 MB.');
	expect(getBackendErrorMessage(new Error('Database failed'))).toBeUndefined();
	expect(getBackendErrorMessage(new ConvexError({ code: 'UPLOAD_NOT_FOUND' }))).toBe(
		'The upload could not be found.'
	);
});
