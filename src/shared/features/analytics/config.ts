// TYPES
import type { PresetTimeRange } from './types/analyticsTypes.js';

export const ANALYTICS_CONFIG = {
	sessionStorageKey: 'analytics:session',
	customerIdStorageKey: 'analytics:customerId'
} as const;

export const DEFAULT_TIME_RANGE: PresetTimeRange = '30d';
export const MAX_RANGE_DAYS = 366;
export const CONTEXT_KEY = 'analytics-dashboard';
/**
 * Order-id shards per `dailySales` day. Writes spread across this many rows; reads pay this many
 * rows per day. Changing it requires rebuilding `dailySales`, because removals look the order's
 * shard up with this same number.
 */
export const DAILY_SALES_SHARD_COUNT = 4;
