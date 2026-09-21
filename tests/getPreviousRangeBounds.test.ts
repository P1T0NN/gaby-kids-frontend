import { describe, expect, it } from 'vitest';

import { getPreviousRangeBounds } from '../src/shared/features/analytics/utils/getPreviousRangeBounds.js';

const day = (year: number, month: number, date: number) =>
	new Date(Date.UTC(year, month - 1, date));
const endOfDay = (year: number, month: number, date: number) =>
	new Date(Date.UTC(year, month - 1, date, 23, 59, 59, 999));

describe('getPreviousRangeBounds', () => {
	it('shifts a partial single-day range to the full previous day', () => {
		const from = day(2026, 1, 15);
		const previous = getPreviousRangeBounds({
			from,
			to: new Date(Date.UTC(2026, 0, 15, 14, 30))
		});

		expect(previous.from.getTime()).toBe(day(2026, 1, 14).getTime());
		expect(previous.to.getTime()).toBe(from.getTime() - 1);
	});

	it('shifts multi-day ranges to the same number of full previous days', () => {
		const from = day(2026, 1, 15);
		const previous = getPreviousRangeBounds({
			from,
			to: new Date(Date.UTC(2026, 0, 21, 14, 30))
		});

		expect(previous.from.getTime()).toBe(day(2026, 1, 8).getTime());
		expect(previous.to.getTime()).toBe(from.getTime() - 1);
	});

	it('shifts full-day custom ranges by their day count', () => {
		const from = day(2025, 12, 10);
		const previous = getPreviousRangeBounds({ from, to: endOfDay(2025, 12, 15) });

		expect(previous.from.getTime()).toBe(day(2025, 12, 4).getTime());
		expect(previous.to.getTime()).toBe(from.getTime() - 1);
	});
});
