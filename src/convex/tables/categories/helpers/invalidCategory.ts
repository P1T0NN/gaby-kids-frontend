import { ConvexError } from 'convex/values';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

export function invalidCategory(): ConvexError<BackendErrorData> {
	return new ConvexError<BackendErrorData>({ code: 'INVALID_CATEGORY_DATA' });
}
