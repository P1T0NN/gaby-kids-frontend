// LIBRARIES
import {
	customAction,
	customCtx,
	customMutation,
	customQuery
} from 'convex-helpers/server/customFunctions';
import {
	action as rawAction,
	internalMutation as rawInternalMutation,
	mutation as rawMutation,
	query as rawQuery,
	type ActionCtx,
	type MutationCtx,
	type QueryCtx
} from '../_generated/server.js';
import { ConvexError, v } from 'convex/values';

// AGGREGATES
import { aggregateTriggers } from '../aggregates/triggersAggregate.js';

// AUTH
import {
	getOwnerId,
	requireAdminIdentity,
	requireIdentity
} from '../betterAuth/helpers/requireIdentity.js';
import { enforceRateLimit } from '../rateLimits/helpers/enforceRateLimit.js';

// CONFIG
import { STORAGE_CONFIG } from '../../shared/features/storage/config.js';

// TYPES
import type { Doc } from '../_generated/dataModel.js';
import type { RateLimitedFunctionOptions } from '../rateLimits/types/rateLimitTypes.js';
import type { BackendErrorData } from '../../shared/types/types.js';

const publicMutationContext = customCtx(
	async (ctx: MutationCtx, options: RateLimitedFunctionOptions) => {
		await enforceRateLimit(ctx, options.rateLimit);
		return aggregateTriggers.wrapDB(ctx);
	}
);

const publicActionContext = customCtx(
	async (ctx: ActionCtx, options: RateLimitedFunctionOptions) => {
		await enforceRateLimit(ctx, options.rateLimit);
		return {};
	}
);

const getAuthenticatedMutationContext = async (
	ctx: MutationCtx,
	options: RateLimitedFunctionOptions
) => {
	const identity = await requireIdentity(ctx);
	await enforceRateLimit(ctx, options.rateLimit, identity);
	const wrappedContext = aggregateTriggers.wrapDB(ctx);

	return { db: wrappedContext.db, identity };
};

const authenticatedMutationContext = customCtx(getAuthenticatedMutationContext);

const authenticatedActionContext = customCtx(
	async (ctx: ActionCtx, options: RateLimitedFunctionOptions) => {
		const identity = await requireIdentity(ctx);
		await enforceRateLimit(ctx, options.rateLimit, identity);

		return { identity };
	}
);

const adminActionContext = customCtx(
	async (ctx: ActionCtx, options: RateLimitedFunctionOptions) => {
		const identity = await requireAdminIdentity(ctx);
		await enforceRateLimit(ctx, options.rateLimit, identity);

		return { identity };
	}
);

const authenticatedQueryContext = customCtx(async (ctx: QueryCtx) => ({
	identity: await requireIdentity(ctx)
}));

const adminMutationContext = customCtx(
	async (ctx: MutationCtx, options: RateLimitedFunctionOptions) => {
		const identity = await requireAdminIdentity(ctx);
		await enforceRateLimit(ctx, options.rateLimit, identity);
		const wrappedContext = aggregateTriggers.wrapDB(ctx);

		return { db: wrappedContext.db, identity };
	}
);

const adminQueryContext = customCtx(async (ctx: QueryCtx) => ({
	identity: await requireAdminIdentity(ctx)
}));

export const mutation = customMutation(rawMutation, publicMutationContext);
export const action = customAction(rawAction, publicActionContext);
export const authenticatedMutation = customMutation(rawMutation, authenticatedMutationContext);
const authenticatedUploadContext = (
	rateLimited: boolean,
	getIdentity: typeof requireIdentity = requireIdentity
) => ({
	args: {
		uploadedFiles: v.optional(v.array(v.string())),
		retainedFiles: v.optional(v.array(v.string()))
	},
	input: async (
		ctx: MutationCtx,
		args: { uploadedFiles?: string[]; retainedFiles?: string[] },
		options: RateLimitedFunctionOptions
	) => {
		const identity = await getIdentity(ctx);
		if (rateLimited) await enforceRateLimit(ctx, options.rateLimit, identity);
		const authenticated = { db: aggregateTriggers.wrapDB(ctx).db, identity };
		const keys = args.uploadedFiles;
		const hasTooManyUploadKeys =
			keys !== undefined && keys.length > STORAGE_CONFIG.maxFilesPerUpload;
		if (hasTooManyUploadKeys) {
			throw new ConvexError<BackendErrorData>({
				code: 'TOO_MANY_FILES',
				maxFiles: STORAGE_CONFIG.maxFilesPerUpload
			});
		}
		const hasDuplicateUploadKeys = keys !== undefined && new Set(keys).size !== keys.length;
		if (hasDuplicateUploadKeys) {
			throw new ConvexError<BackendErrorData>({ code: 'DUPLICATE_UPLOAD_KEY' });
		}

		const uploads: Doc<'storageUploads'>[] = [];
		for (const key of keys ?? []) {
			const upload = await ctx.db
				.query('storageUploads')
				.withIndex('by_key', (query) => query.eq('key', key))
				.unique();
			const isUnavailableUpload =
				!upload ||
				upload.ownerId !== getOwnerId(authenticated.identity) ||
				upload.status !== 'uploaded';
			if (isUnavailableUpload) {
				throw new ConvexError<BackendErrorData>({ code: 'UPLOAD_NOT_FOUND' });
			}
			uploads.push(upload);
		}

		return {
			ctx: authenticated,
			args: {
				uploadedFiles: keys ?? null,
				retainedFiles: args.retainedFiles ?? null
			},
			onSuccess: async () => {
				for (const upload of uploads) await ctx.db.delete(upload._id);
			}
		};
	}
});

export const authenticatedUploadMutation = customMutation(
	rawMutation,
	authenticatedUploadContext(true)
);
export const adminUploadMutation = customMutation(
	rawMutation,
	authenticatedUploadContext(true, requireAdminIdentity)
);
export const authenticatedUploadInternalMutation = customMutation(
	rawInternalMutation,
	authenticatedUploadContext(false)
);
export const authenticatedAction = customAction(rawAction, authenticatedActionContext);
export const adminAction = customAction(rawAction, adminActionContext);
export const authenticatedQuery = customQuery(rawQuery, authenticatedQueryContext);
export const adminMutation = customMutation(rawMutation, adminMutationContext);
export const adminQuery = customQuery(rawQuery, adminQueryContext);

export const internalMutation = customMutation(
	rawInternalMutation,
	customCtx(aggregateTriggers.wrapDB)
);
