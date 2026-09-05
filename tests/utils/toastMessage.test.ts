import { ConvexError } from 'convex/values';
import { expect, test } from 'vitest';

import { overwriteGetLocale } from '../../src/lib/paraglide/runtime.js';
import { getBackendErrorMessage } from '../../src/utils/getBackendErrorMessage.js';

test('translates known backend error codes and ignores unknown errors', () => {
	overwriteGetLocale(() => 'en');
	expect(getBackendErrorMessage(new ConvexError({ code: 'TOO_MANY_FILES', maxFiles: 5 }))).toBe(
		'You can upload at most 5 files.'
	);
	expect(getBackendErrorMessage(new Error('Database failed'))).toBeUndefined();
	expect(getBackendErrorMessage(new ConvexError({ code: 'UPLOAD_NOT_FOUND' }))).toBe(
		'The upload could not be found.'
	);
});
