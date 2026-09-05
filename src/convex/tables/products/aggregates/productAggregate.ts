// LIBRARIES
import { TableAggregate } from '@convex-dev/aggregate';

// CONVEX
import { components } from '../../../_generated/api.js';

// TYPES
import type { DataModel } from '../../../_generated/dataModel.js';

export const productAggregate = new TableAggregate<{
	Key: number;
	DataModel: DataModel;
	TableName: 'products';
}>(components.productsAggregate, {
	sortKey: (product) => product._creationTime
});
