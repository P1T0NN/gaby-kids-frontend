import { describe, expect, it } from 'vitest';

import { formatRelativeTime } from '../src/shared/utils/date.js';

describe('formatRelativeTime', () => {
	it('formats past and future timestamps', () => {
		const now = Date.UTC(2026, 7, 30, 12);

		expect(formatRelativeTime(now - 5 * 60_000, 'en-US', now)).toBe('5m ago');
		expect(formatRelativeTime(now + 2 * 60 * 60_000, 'en-US', now)).toBe('in 2h');
	});
});
