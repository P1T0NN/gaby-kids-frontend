// LIBRARIES
import { TableAggregate } from '@convex-dev/aggregate';

// CONVEX
import { components } from '../../../_generated/api.js';

// TYPES
import type { DataModel } from '../../../_generated/dataModel.js';

export const orderAggregate = new TableAggregate<{
	Key: number;
	DataModel: DataModel;
	TableName: 'orders';
}>(components.ordersAggregate, {
	sortKey: (order) => order._creationTime
});
