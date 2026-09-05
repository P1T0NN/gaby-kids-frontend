import { defineSchema } from 'convex/server';

import { tables } from './generatedSchema.js';

const schema = defineSchema({
	...tables,
	user: tables.user
		.index('by_role', ['role'])
		.index('by_banned', ['banned'])
		.index('by_email_verified', ['emailVerified'])
		.index('by_banned_and_role', ['banned', 'role'])
		.index('by_email_verified_and_role', ['emailVerified', 'role'])
		.index('by_banned_and_email_verified', ['banned', 'emailVerified'])
		.index('by_banned_and_email_verified_and_role', ['banned', 'emailVerified', 'role'])
});

export default schema;
