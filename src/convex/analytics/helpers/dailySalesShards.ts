// CONFIG
import { DAILY_SALES_SHARD_COUNT } from '../../../shared/features/analytics/config.js';

// HELPERS
import { hashString } from './stableHash.js';

export function shardForOrder(orderId: string): number {
	return hashString(orderId) % DAILY_SALES_SHARD_COUNT;
}
