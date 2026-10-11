import { DirectAggregate } from '@convex-dev/aggregate';
import { components } from '../../../../_generated/api.js';

/** Exact global user total maintained by Better Auth user triggers. */
export const userTotalAggregate = new DirectAggregate<{ Key: null; Id: string }>(
	components.usersAggregate
);
