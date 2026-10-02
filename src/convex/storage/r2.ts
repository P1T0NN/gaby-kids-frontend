// LIBRARIES
import { R2 } from '@convex-dev/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConvexError, v } from 'convex/values';

// CONVEX
import { components, internal } from '../_generated/api.js';
import { internalQuery } from '../_generated/server.js';
import { authenticatedMutation, internalMutation } from '../builders/convexFunctionBuilders.js';
import { getOwnerId, requireIdentity } from '../betterAuth/helpers/requireIdentity.js';
import schema from '../schema.js';

// STORAGE
import { getUploadByKey } from './getUploadByKey.js';

// CONFIG
import { STORAGE_CONFIG, STORAGE_OPTIMIZE_CONFIG } from '../../shared/features/storage/config.js';
import { exceedsUploadBatchLimit } from '../../shared/features/storage/utils/exceedsUploadBatchLimit.js';

// TYPES
import type { MutationCtx } from '../_generated/server.js';
import type { Doc } from '../_generated/dataModel.js';
import type { BackendErrorData } from '../../shared/types/types.js';

export const r2 = new R2(components.r2, {
	bucket: process.env.STORAGE_BUCKET_NAME,
	endpoint: process.env.STORAGE_ENDPOINT,
	accessKeyId: process.env.STORAGE_ACCESS_KEY_ID,
	secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY
});

/** Never fall back to the public image bucket for unvalidated originals. */
export function getTemporaryR2(bucket = process.env.STORAGE_TEMP_BUCKET_NAME): R2 {
	if (!bucket || bucket === r2.config.bucket)
		throw new Error('A separate private STORAGE_TEMP_BUCKET_NAME is required.');
	const endpoint = process.env.STORAGE_TEMP_ENDPOINT;
	const accessKeyId = process.env.STORAGE_TEMP_ACCESS_KEY_ID;
	const secretAccessKey = process.env.STORAGE_TEMP_SECRET_ACCESS_KEY;
	if (!endpoint || !accessKeyId || !secretAccessKey)
		throw new Error(
			'STORAGE_TEMP_ENDPOINT, STORAGE_TEMP_ACCESS_KEY_ID and STORAGE_TEMP_SECRET_ACCESS_KEY are required.'
		);
	return new R2(components.r2, { bucket, endpoint, accessKeyId, secretAccessKey });
}

function normalizeUploadNamespace(namespace: string | undefined): string | undefined {
	if (namespace === undefined) return undefined;
	const normalized = namespace.trim().replace(/^\/+|\/+$/g, '');
	if (!normalized) return undefined;
	const hasInvalidSegment = normalized.split('/').some((segment) => {
		const unsafePath =
			segment === '' || segment === '.' || segment === '..' || segment.includes('\\');
		return (
			unsafePath ||
			[...segment].some(
				(character) => character.charCodeAt(0) <= 0x1f || character.charCodeAt(0) === 0x7f
			)
		);
	});
	if (hasInvalidSegment)
		throw new ConvexError<BackendErrorData>({ code: 'INVALID_UPLOAD_NAMESPACE' });
	return normalized;
}

export const generateUploadUrls = authenticatedMutation({
	rateLimit: { name: 'storage:upload' },
	args: {
		namespace: v.optional(v.string()),
		files: v.array(v.object({ size: v.number(), contentType: v.string() }))
	},
	returns: v.array(v.object({ key: v.string(), url: v.string() })),
	handler: async (ctx, args) => {
		const invalidFiles =
			args.files.length === 0 ||
			args.files.some((file) => {
				const invalidSize =
					!Number.isInteger(file.size) ||
					file.size <= 0 ||
					file.size > STORAGE_CONFIG.maxFileSizeBytes;
				return (
					invalidSize || !STORAGE_CONFIG.allowedImageTypes.some((type) => type === file.contentType)
				);
			});
		if (invalidFiles) throw new ConvexError<BackendErrorData>({ code: 'INVALID_UPLOAD' });
		if (exceedsUploadBatchLimit(args.files.map((file) => file.size))) {
			throw new ConvexError<BackendErrorData>({
				code: 'UPLOAD_BATCH_TOO_LARGE',
				maxSizeMB: STORAGE_CONFIG.maxTotalUploadBytes / (1024 * 1024)
			});
		}
		const temporary = getTemporaryR2();
		const namespace = normalizeUploadNamespace(args.namespace);
		const uploads: { key: string; url: string }[] = [];
		for (const file of args.files) {
			const id = crypto.randomUUID();
			const key = namespace ? `${namespace}/${id}.webp` : `${id}.webp`;
			const temporaryKey = `originals/${id}`;
			const record = {
				ownerId: getOwnerId(ctx.identity),
				expectedSize: file.size,
				expectedContentType: file.contentType,
				status: 'pending' as const,
				createdAt: Date.now()
			};
			// Both keys are tracked before the browser can upload, including a failed final PUT.
			await ctx.db.insert('storageUploads', { ...record, key, temporaryKey });
			await ctx.db.insert('storageUploads', {
				...record,
				key: temporaryKey,
				bucket: temporary.config.bucket
			});
			const url = await getSignedUrl(
				temporary.client,
				new PutObjectCommand({
					Bucket: temporary.config.bucket,
					Key: temporaryKey,
					ContentType: file.contentType,
					ContentLength: file.size
				}),
				{ expiresIn: STORAGE_CONFIG.uploadUrlExpiresSeconds }
			);
			uploads.push({ key, url });
		}
		return uploads;
	}
});

/** Keep deletion records until the object is gone and late uploads/actions have expired. */
export async function queueUploadDeletion(
	ctx: MutationCtx,
	uploads: Doc<'storageUploads'>[]
): Promise<void> {
	if (uploads.length === 0) return;
	const keys = new Set(uploads.map((upload) => upload.key));
	for (const upload of uploads) {
		if (upload.temporaryKey) keys.add(upload.temporaryKey);
	}
	for (const key of keys) {
		const upload = await getUploadByKey(ctx, key);
		if (upload) await ctx.db.patch(upload._id, { status: 'deleting' });
	}
	await ctx.scheduler.runAfter(0, internal.storage.actions.cleanupUploads, { keys: [...keys] });
}

export const deleteObject = authenticatedMutation({
	args: { key: v.string() },
	returns: v.null(),
	handler: async (ctx, { key }) => {
		const upload = await getUploadByKey(ctx, key);
		if (!upload) return null;
		if (upload.ownerId !== getOwnerId(ctx.identity))
			throw new ConvexError<BackendErrorData>({ code: 'UPLOAD_NOT_FOUND' });
		await queueUploadDeletion(ctx, [upload]);
		return null;
	}
});

export const beginProcessing = internalMutation({
	args: { keys: v.array(v.string()) },
	returns: v.array(schema.doc('storageUploads')),
	handler: async (ctx, { keys }) => {
		const ownerId = getOwnerId(await requireIdentity(ctx));
		if (keys.length === 0 || new Set(keys).size !== keys.length)
			throw new ConvexError<BackendErrorData>({ code: 'DUPLICATE_UPLOAD_KEY' });
		const uploads: Doc<'storageUploads'>[] = [];
		for (const key of keys) {
			const upload = await getUploadByKey(ctx, key);
			const temporaryKey = upload?.temporaryKey;
			const unavailable =
				!upload ||
				upload.ownerId !== ownerId ||
				upload.status !== 'pending' ||
				!temporaryKey ||
				upload.bucket !== undefined;
			if (unavailable) throw new ConvexError<BackendErrorData>({ code: 'UPLOAD_NOT_FOUND' });
			const original = await getUploadByKey(ctx, temporaryKey);
			if (
				!original ||
				original.ownerId !== ownerId ||
				original.status !== 'pending' ||
				!original.bucket
			)
				throw new ConvexError<BackendErrorData>({ code: 'UPLOAD_NOT_FOUND' });
			await ctx.db.patch(upload._id, { status: 'processing', createdAt: Date.now() });
			await ctx.db.patch(original._id, { status: 'processing', createdAt: Date.now() });
			uploads.push(upload);
		}
		if (exceedsUploadBatchLimit(uploads.map((upload) => upload.expectedSize)))
			throw new ConvexError<BackendErrorData>({
				code: 'UPLOAD_BATCH_TOO_LARGE',
				maxSizeMB: STORAGE_CONFIG.maxTotalUploadBytes / (1024 * 1024)
			});
		return uploads;
	}
});

export const completeProcessing = internalMutation({
	args: { files: v.array(v.object({ key: v.string(), size: v.number() })) },
	returns: v.null(),
	handler: async (ctx, { files }) => {
		const ownerId = getOwnerId(await requireIdentity(ctx));
		for (const file of files) {
			const upload = await getUploadByKey(ctx, file.key);
			if (
				!upload ||
				upload.ownerId !== ownerId ||
				upload.status !== 'processing' ||
				!upload.temporaryKey
			)
				throw new ConvexError<BackendErrorData>({ code: 'UPLOAD_NOT_FOUND' });
			const metadata = await r2.getMetadata(ctx, file.key);
			const valid =
				metadata?.size === file.size &&
				file.size > 0 &&
				file.size <= STORAGE_OPTIMIZE_CONFIG.maxSizeMB * 1024 * 1024 &&
				metadata?.contentType === 'image/webp';
			if (!valid) throw new ConvexError<BackendErrorData>({ code: 'INVALID_UPLOAD' });
			const original = await getUploadByKey(ctx, upload.temporaryKey);
			if (!original || original.status !== 'processing')
				throw new ConvexError<BackendErrorData>({ code: 'UPLOAD_NOT_FOUND' });
			await ctx.db.patch(original._id, { status: 'deleting' });
			await ctx.db.patch(upload._id, { status: 'uploaded' });
		}
		return null;
	}
});

export const getUpload = internalQuery({
	args: { key: v.string() },
	returns: v.union(schema.doc('storageUploads'), v.null()),
	handler: (ctx, { key }) => getUploadByKey(ctx, key)
});

export const getStaleUploads = internalQuery({
	args: { cutoff: v.number() },
	returns: v.array(schema.doc('storageUploads')),
	handler: (ctx, { cutoff }) =>
		ctx.db
			.query('storageUploads')
			.withIndex('by_created_at', (query) => query.lt('createdAt', cutoff))
			.take(STORAGE_CONFIG.cleanupBatchSize)
});

export const markDeleting = internalMutation({
	args: { keys: v.array(v.string()) },
	returns: v.null(),
	handler: async (ctx, { keys }) => {
		const uploads: Doc<'storageUploads'>[] = [];
		for (const key of keys) {
			const upload = await getUploadByKey(ctx, key);
			if (upload) uploads.push(upload);
		}
		await queueUploadDeletion(ctx, uploads);
		return null;
	}
});

export const recordDeletionResult = internalMutation({
	args: { key: v.string(), deleted: v.boolean() },
	returns: v.null(),
	handler: async (ctx, { key, deleted }) => {
		const upload = await getUploadByKey(ctx, key);
		const safeToForget =
			upload?.status === 'deleting' &&
			upload.createdAt < Date.now() - STORAGE_CONFIG.uploadTtlMinutes * 60_000;
		if (safeToForget) {
			if (deleted) await ctx.db.delete(upload._id);
			// Move expired failures behind other stale entries so one bad object cannot block cleanup.
			else
				await ctx.db.patch(upload._id, {
					createdAt:
						Date.now() -
						(STORAGE_CONFIG.uploadTtlMinutes - STORAGE_CONFIG.cleanupIntervalMinutes) * 60_000
				});
		}
		return null;
	}
});

export async function deleteStoredFiles(ctx: MutationCtx, keys: string[]): Promise<void> {
	for (const key of keys) {
		if (!key.startsWith('http://') && !key.startsWith('https://'))
			await ctx.runMutation(components.r2.lib.deleteObject, { ...r2.config, key });
	}
}

export async function resolveStoredFileUrls(keys: string[]): Promise<string[]> {
	const publicUrl = process.env.STORAGE_PUBLIC_URL?.replace(/\/+$/, '');
	return Promise.all(
		keys.map((key) => {
			if (key.startsWith('http://') || key.startsWith('https://')) return key;
			if (publicUrl) return `${publicUrl}/${key.split('/').map(encodeURIComponent).join('/')}`;
			return r2.getUrl(key, { expiresIn: 60 * 60 });
		})
	);
}
