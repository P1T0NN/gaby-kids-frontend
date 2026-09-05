// LIBRARIES
import { TableAggregate } from '@convex-dev/aggregate';

// CONVEX
import { components } from '../../../_generated/api.js';

// TYPES
import type { DataModel } from '../../../_generated/dataModel.js';

export const categoryAggregate = new TableAggregate<{
	Key: number;
	DataModel: DataModel;
	TableName: 'categories';
}>(components.categoriesAggregate, {
	sortKey: (category) => category._creationTime
});
