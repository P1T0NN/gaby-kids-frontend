// LIBRARIES
import { Migrations } from '@convex-dev/migrations';
import { components } from '../_generated/api.js';

// WRAPPERS
import { internalMutation } from '../builders/convexFunctionBuilders.js';

// SCHEMA
import schema from '../schema.js';

/** Shared migration registry for every table and data backfill. */
export const migrations = new Migrations(components.migrations, {
	schema,
	internalMutation
});

/** Generic CLI/dashboard runner for every registered migration. */
export const run = migrations.runner();
