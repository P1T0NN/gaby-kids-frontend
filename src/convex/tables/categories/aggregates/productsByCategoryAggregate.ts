// LIBRARIES
import { DirectAggregate } from '@convex-dev/aggregate';

// CONVEX
import { components } from '../../../_generated/api.js';

// TYPES
import type { Id } from '../../../_generated/dataModel.js';

export const productsByCategoryAggregate = new DirectAggregate<{
	Key: number;
	Id: Id<'products'>;
	Namespace: Id<'categories'>;
}>(components.categoriesAggregate);
