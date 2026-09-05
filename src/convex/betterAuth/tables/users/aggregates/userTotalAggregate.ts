// AGGREGATES
import { createCounterAggregate } from '../../../../aggregates/helpers/createCounterAggregate.js';

/** Exact global user total maintained by Better Auth user triggers. */
export const userTotalAggregate = createCounterAggregate('users');
