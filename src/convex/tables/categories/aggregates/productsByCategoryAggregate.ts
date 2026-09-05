// LIBRARIES
import { TableAggregate } from '@convex-dev/aggregate';

// CONVEX
import { components } from '../../../_generated/api.js';

// TYPES
import type { DataModel, Id } from '../../../_generated/dataModel.js';

export const productsByCategoryAggregate = new TableAggregate<{
	Key: number;
	DataModel: DataModel;
	TableName: 'products';
	Namespace: Id<'categories'>;
}>(components.categoriesAggregate, {
	namespace: (product) => product.categoryId,
	sortKey: (product) => product._creationTime
});
