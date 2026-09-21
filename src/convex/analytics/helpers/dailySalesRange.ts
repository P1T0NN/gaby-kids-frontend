// CONFIG
import { COMPANY_DATA } from '../../../shared/config.js';

// UTILS
import { getStoreDayKey } from '../../../shared/utils/date.js';

// TYPES
import type { Doc } from '../../_generated/dataModel.js';
import type { QueryCtx } from '../../_generated/server.js';

export const DAY_IN_MS = 86_400_000;

export async function readDailySalesRows(
	ctx: QueryCtx,
	bounds: { from: number; to: number }
): Promise<Doc<'dailySales'>[]> {
	const firstDay = getStoreDayKey(bounds.from, COMPANY_DATA.TIMEZONE);
	const lastDay = getStoreDayKey(bounds.to, COMPANY_DATA.TIMEZONE);

	return ctx.db
		.query('dailySales')
		.withIndex('by_day_shard', (q) => q.gte('day', firstDay).lte('day', lastDay))
		.collect();
}
