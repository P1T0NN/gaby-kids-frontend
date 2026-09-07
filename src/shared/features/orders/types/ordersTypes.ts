import type { DataModel } from '../../../../convex/_generated/dataModel.js';
import type { NamedTableInfo, OrderedQuery } from 'convex/server';

export type OrderQuery = OrderedQuery<NamedTableInfo<DataModel, 'orders'>>;
