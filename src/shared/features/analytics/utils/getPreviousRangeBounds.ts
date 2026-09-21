// CONFIG
import { COMPANY_DATA } from '../../../config.js';

// UTILS
import { DAY_MS, getStoreDayStart } from '../../../utils/date.js';

// TYPES
import type { RangeBounds } from '../types/analyticsTypes.js';

export function getPreviousRangeBounds(
	bounds: RangeBounds,
	timeZone: string = COMPANY_DATA.TIMEZONE
): RangeBounds {
	const from = bounds.from.getTime();
	const fromDayStart = getStoreDayStart(from, timeZone);
	const toDayStart = getStoreDayStart(bounds.to.getTime(), timeZone);
	const dayCount = Math.max(1, Math.round((toDayStart - fromDayStart) / DAY_MS) + 1);

	return {
		from: new Date(getStoreDayStart(fromDayStart - dayCount * DAY_MS, timeZone)),
		to: new Date(from - 1)
	};
}
