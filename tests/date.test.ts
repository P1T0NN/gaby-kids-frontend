import { describe, expect, it } from 'vitest';

import { formatRelativeTime, getStoreDayKey, getStoreDayStart } from '../src/shared/utils/date.js';

describe('formatRelativeTime', () => {
	it('formats past and future timestamps', () => {
		const now = Date.UTC(2026, 7, 30, 12);

		expect(formatRelativeTime(now - 5 * 60_000, 'en-US', now)).toBe('5m ago');
		expect(formatRelativeTime(now + 2 * 60 * 60_000, 'en-US', now)).toBe('in 2h');
	});
});

describe('store day helpers', () => {
	it('keys the store day for positive-offset zones', () => {
		// 2026-01-15 00:30 in Belgrade (UTC+1) is Jan 15, though it is Jan 14 23:30 UTC.
		const lateNight = Date.UTC(2026, 0, 14, 23, 30);

		expect(getStoreDayKey(lateNight, 'Europe/Belgrade')).toBe(Date.UTC(2026, 0, 15));
		expect(getStoreDayStart(lateNight, 'Europe/Belgrade')).toBe(Date.UTC(2026, 0, 14, 23));
	});

	it('keys the store day for negative-offset zones', () => {
		// 2026-01-15 20:00 in New York (UTC-5) is Jan 15, though it is Jan 16 01:00 UTC.
		const evening = Date.UTC(2026, 0, 16, 1);

		expect(getStoreDayKey(evening, 'America/New_York')).toBe(Date.UTC(2026, 0, 15));
		expect(getStoreDayStart(evening, 'America/New_York')).toBe(Date.UTC(2026, 0, 15, 5));
	});

	it('follows DST transitions for the day start', () => {
		// Belgrade switches to UTC+2 on 2026-03-29, so that day starts at 22:00 UTC the day before.
		const dstDay = Date.UTC(2026, 2, 29, 12);

		expect(getStoreDayStart(dstDay, 'Europe/Belgrade')).toBe(Date.UTC(2026, 2, 28, 23));
	});
});
