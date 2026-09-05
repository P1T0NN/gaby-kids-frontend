// LIBRARIES
import { ConvexError } from 'convex/values';

// TYPES
import type { UserIdentity } from 'convex/server';
import type { MutationCtx } from '../../_generated/server.js';
import type { BackendErrorData } from '../../../shared/types/types.js';

type AuthContext = Pick<MutationCtx, 'auth'>;

export async function requireIdentity(ctx: AuthContext): Promise<UserIdentity> {
	const identity = await ctx.auth.getUserIdentity();
	if (identity === null) {
		throw new ConvexError<BackendErrorData>({ code: 'UNAUTHENTICATED' });
	}

	return identity;
}

export function normalizeOwnerId(ownerId: string): string {
	const separator = ownerId.lastIndexOf('|');
	return separator === -1 ? ownerId : ownerId.slice(separator + 1);
}

export function getOwnerId(identity: UserIdentity): string {
	return identity.subject;
}

export async function requireAdminIdentity(ctx: AuthContext): Promise<UserIdentity> {
	const identity = await requireIdentity(ctx);
	if (identity.role !== 'admin') {
		throw new ConvexError<BackendErrorData>({ code: 'FORBIDDEN' });
	}

	return identity;
}
