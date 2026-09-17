// LIBRARIES
import { R2 } from '@convex-dev/r2';
import { makeFunctionReference } from 'convex/server';
import { ConvexError, v } from 'convex/values';

// CONVEX
import { components } from '../_generated/api.js';
import {
	authenticatedAction,
	authenticatedMutation,
	internalMutation
} from '../builders/convexFunctionBuilders.js';
import { getOwnerId, requireIdentity } from '../betterAuth/helpers/requireIdentity.js';

// STORAGE
import { getUploadByKey } from './getUploadByKey.js';

// CONFIG
import { STORAGE_CONFIG } from '../../shared/features/storage/config.js';

// TYPES
import type { DataModel } from '../_generated/dataModel.js';
import type { MutationCtx } from '../_generated/server.js';
import type { BackendErrorData } from '../../shared/types/types.js';

export const r2 = new R2(components.r2, {
	bucket: process.env.STORAGE_BUCKET_NAME,
	endpoint: process.env.STORAGE_ENDPOINT,
	accessKeyId: process.env.STORAGE_ACCESS_KEY_ID,
	secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY
});

const clientApi = r2.clientApi<DataModel>({
	checkDelete: async (ctx, _bucket, key) => {
		const identity = await requireIdentity(ctx);
		const upload = await getUploadByKey(ctx, key);
		const isUnavailableUpload = !upload || upload.ownerId !== getOwnerId(identity);
		if (isUnavailableUpload) {
			throw new ConvexError<BackendErrorData>({ code: 'UPLOAD_NOT_FOUND' });
		}
	},
	onDelete: async (ctx, _bucket, key) => {
		const upload = await getUploadByKey(ctx, key);
		if (upload) await ctx.db.delete(upload._id);
	}
});

export const deleteObject = clientApi.deleteObject;

const checkPendingUploadReference = makeFunctionReference<
	'mutation',
	{ key: string; ownerId: string },
	boolean
>('storage/r2:checkPendingUpload');
const validateUploadReference = makeFunctionReference<
	'mutation',
	{ key: string; ownerId: string; detectedContentType?: string },
	boolean
>('storage/r2:validateUpload');

export function detectImageContentType(bytes: Uint8Array): string | undefined {
	const hasPngSignature =
		bytes.length >= 8 &&
		bytes[0] === 0x89 &&
		bytes[1] === 0x50 &&
		bytes[2] === 0x4e &&
		bytes[3] === 0x47 &&
		bytes[4] === 0x0d &&
		bytes[5] === 0x0a &&
		bytes[6] === 0x1a &&
		bytes[7] === 0x0a;
	if (hasPngSignature) {
		return 'image/png';
	}
	const hasJpegSignature =
		bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
	if (hasJpegSignature) {
		return 'image/jpeg';
	}
	// Preserve byte offsets: RIFF's binary size field is not UTF-8 text.
	const header = String.fromCharCode(...bytes.subarray(0, 12));
	const hasGifSignature = header.startsWith('GIF87a') || header.startsWith('GIF89a');
	if (hasGifSignature) return 'image/gif';
	const hasWebpSignature = header.startsWith('RIFF') && header.slice(8, 12) === 'WEBP';
	if (hasWebpSignature) return 'image/webp';
	return undefined;
}

function normalizeUploadNamespace(namespace: string | undefined): string | undefined {
	if (namespace === undefined) return undefined;

	const normalized = namespace.trim().replace(/^\/+|\/+$/g, '');
	if (!normalized) return undefined;

	const segments = normalized.split('/');
	const hasInvalidSegment = segments.some((segment) => {
		const isUnsafePathSegment =
			segment === '' || segment === '.' || segment === '..' || segment.includes('\\');
		if (isUnsafePathSegment) {
			return true;
		}
		return [...segment].some((character) => {
			const code = character.charCodeAt(0);
			return code <= 0x1f || code === 0x7f;
		});
	});
	if (hasInvalidSegment) {
		throw new ConvexError<BackendErrorData>({ code: 'INVALID_UPLOAD_NAMESPACE' });
	}

	return segments.join('/');
}

export const generateUploadUrl = authenticatedMutation({
	rateLimit: { name: 'storage:upload' },
	args: {
		namespace: v.optional(v.string()),
		size: v.number(),
		contentType: v.string()
	},
	returns: v.object({ key: v.string(), url: v.string() }),
	handler: async (ctx, args) => {
		const hasInvalidSize =
			!Number.isInteger(args.size) || args.size <= 0 || args.size > STORAGE_CONFIG.maxFileSizeBytes;
		const hasUnsupportedContentType = !STORAGE_CONFIG.allowedImageTypes.some(
			(type) => type === args.contentType
		);
		const hasInvalidUpload = hasInvalidSize || hasUnsupportedContentType;
		if (hasInvalidUpload) {
			throw new ConvexError<BackendErrorData>({ code: 'INVALID_UPLOAD' });
		}
		const namespace = normalizeUploadNamespace(args.namespace);
		const customKey = namespace ? `${namespace}/${crypto.randomUUID()}` : undefined;
		const upload = await r2.generateUploadUrl(customKey);
		await ctx.db.insert('storageUploads', {
			ownerId: getOwnerId(ctx.identity),
			key: upload.key,
			expectedSize: args.size,
			expectedContentType: args.contentType,
			status: 'pending',
			createdAt: Date.now()
		});
		return upload;
	}
});

export const checkPendingUpload = internalMutation({
	args: { key: v.string(), ownerId: v.string() },
	returns: v.boolean(),
	handler: async (ctx, args) => {
		const upload = await ctx.db
			.query('storageUploads')
			.withIndex('by_key', (query) => query.eq('key', args.key))
			.unique();
		return upload?.ownerId === args.ownerId && upload.status === 'pending';
	}
});

export const validateUpload = internalMutation({
	args: { key: v.string(), ownerId: v.string(), detectedContentType: v.optional(v.string()) },
	returns: v.boolean(),
	handler: async (ctx, args) => {
		const upload = await ctx.db
			.query('storageUploads')
			.withIndex('by_key', (query) => query.eq('key', args.key))
			.unique();
		const isUnavailablePendingUpload =
			!upload || upload.ownerId !== args.ownerId || upload.status !== 'pending';
		if (isUnavailablePendingUpload) return false;

		const metadata = await r2.getMetadata(ctx, args.key);
		const valid =
			metadata !== null &&
			metadata.size !== undefined &&
			metadata.size === upload.expectedSize &&
			metadata.size <= STORAGE_CONFIG.maxFileSizeBytes &&
			metadata.contentType === upload.expectedContentType &&
			args.detectedContentType === upload.expectedContentType;
		if (valid) {
			await ctx.db.patch(upload._id, { status: 'uploaded' });
			return true;
		}

		await r2.deleteObject(ctx, args.key);
		await ctx.db.delete(upload._id);
		return false;
	}
});

export const syncMetadata = authenticatedAction({
	rateLimit: { name: 'storage:upload' },
	args: { key: v.string() },
	returns: v.boolean(),
	handler: async (ctx, args) => {
		const ownerId = getOwnerId(ctx.identity);
		const pending = await ctx.runMutation(checkPendingUploadReference, {
			key: args.key,
			ownerId
		});
		if (!pending) return false;

		await r2.syncMetadata(ctx, args.key);
		const metadata = await r2.getMetadata(ctx, args.key);
		let detectedContentType: string | undefined;
		const canInspectFileSignature =
			metadata?.size !== undefined && metadata.size <= STORAGE_CONFIG.maxFileSizeBytes;
		if (canInspectFileSignature) {
			const response = await fetch(await r2.getUrl(args.key, { expiresIn: 60 }), {
				headers: { Range: 'bytes=0-11' }
			});
			if (response.ok) {
				detectedContentType = detectImageContentType(new Uint8Array(await response.arrayBuffer()));
			}
		}
		return ctx.runMutation(validateUploadReference, {
			key: args.key,
			ownerId,
			detectedContentType
		});
	}
});

export const cleanupStaleUploads = internalMutation({
	args: {},
	returns: v.number(),
	handler: async (ctx) => {
		const staleUploads = await ctx.db
			.query('storageUploads')
			.withIndex('by_created_at', (query) =>
				query.lt('createdAt', Date.now() - STORAGE_CONFIG.uploadTtlMinutes * 60_000)
			)
			.take(STORAGE_CONFIG.cleanupBatchSize);

		for (const upload of staleUploads) {
			await r2.deleteObject(ctx, upload.key);
			await ctx.db.delete(upload._id);
		}
		return staleUploads.length;
	}
});

export async function deleteStoredFiles(ctx: MutationCtx, keys: string[]): Promise<void> {
	for (const key of keys) {
		// Preserve legacy public URLs; new R2 uploads are stored as object keys.
		if (!key.startsWith('http://') && !key.startsWith('https://')) {
			await ctx.runMutation(components.r2.lib.deleteObject, { ...r2.config, key });
		}
	}
}

export async function resolveStoredFileUrls(keys: string[]): Promise<string[]> {
	const publicUrl = process.env.STORAGE_PUBLIC_URL?.replace(/\/+$/, '');
	return Promise.all(
		keys.map((key) => {
			if (key.startsWith('http://') || key.startsWith('https://')) return key;
			if (publicUrl) {
				return `${publicUrl}/${key.split('/').map(encodeURIComponent).join('/')}`;
			}
			return r2.getUrl(key, { expiresIn: 60 * 60 });
		})
	);
}
