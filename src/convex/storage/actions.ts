'use node';

// LIBRARIES
import { DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { ConvexError, v } from 'convex/values';

// CONVEX
import { internal } from '../_generated/api.js';
import { internalAction } from '../_generated/server.js';
import { authenticatedAction } from '../builders/convexFunctionBuilders.js';

// STORAGE
import { r2, getTemporaryR2 } from './r2.js';
import { optimizeToWebp } from '../../features/storage/server/optimizeToWebp.js';

// CONFIG
import { STORAGE_CONFIG } from '../../shared/features/storage/config.js';

// TYPES
import type { BackendErrorData } from '../../shared/types/types.js';

export const processUploads = authenticatedAction({
	rateLimit: { name: 'storage:upload' },
	args: { keys: v.array(v.string()) },
	returns: v.array(v.string()),
	handler: async (ctx, { keys }): Promise<string[]> => {
		// Acquire all keys atomically before IO; concurrent processing is refused.
		const uploads = await ctx.runMutation(internal.storage.r2.beginProcessing, { keys });
		try {
			const outputs: Buffer[] = [];
			let outputBytes = 0;
			for (const upload of uploads) {
				if (!upload.temporaryKey)
					throw new ConvexError<BackendErrorData>({ code: 'UPLOAD_NOT_FOUND' });
				const original = await ctx.runQuery(internal.storage.r2.getUpload, {
					key: upload.temporaryKey
				});
				if (!original?.bucket)
					throw new ConvexError<BackendErrorData>({ code: 'UPLOAD_NOT_FOUND' });
				const temporary = getTemporaryR2(original.bucket);
				const response = await temporary.client.send(
					new GetObjectCommand({ Bucket: original.bucket, Key: original.key })
				);
				const size = response.ContentLength;
				const validSize =
					size !== undefined &&
					size === upload.expectedSize &&
					size > 0 &&
					size <= STORAGE_CONFIG.maxFileSizeBytes;
				if (!validSize) throw new ConvexError<BackendErrorData>({ code: 'INVALID_UPLOAD' });
				// The S3 body is raw bytes; a user-supplied Content-Encoding cannot inflate it via fetch.
				const bytes = await response.Body?.transformToByteArray();
				if (!bytes || bytes.byteLength !== size)
					throw new ConvexError<BackendErrorData>({ code: 'INVALID_UPLOAD' });
				const output = await optimizeToWebp(bytes);
				outputBytes += output.byteLength;
				if (outputBytes > STORAGE_CONFIG.maxTotalUploadBytes)
					throw new ConvexError<BackendErrorData>({
						code: 'UPLOAD_BATCH_TOO_LARGE',
						maxSizeMB: STORAGE_CONFIG.maxTotalUploadBytes / (1024 * 1024)
					});
				outputs.push(output);
			}
			// Store final images only once every original has decoded and optimized successfully.
			for (let index = 0; index < uploads.length; index++) {
				await r2.store(ctx, outputs[index], { key: uploads[index].key, type: 'image/webp' });
			}
			// Delete originals before reporting success; retain records for the expiry sweep.
			for (const upload of uploads) {
				if (!upload.temporaryKey)
					throw new ConvexError<BackendErrorData>({ code: 'UPLOAD_NOT_FOUND' });
				const original = await ctx.runQuery(internal.storage.r2.getUpload, {
					key: upload.temporaryKey
				});
				if (!original?.bucket)
					throw new ConvexError<BackendErrorData>({ code: 'UPLOAD_NOT_FOUND' });
				const temporary = getTemporaryR2(original.bucket);
				await temporary.client.send(
					new DeleteObjectCommand({ Bucket: original.bucket, Key: original.key })
				);
			}
			await ctx.runMutation(internal.storage.r2.completeProcessing, {
				files: uploads.map((upload, index) => ({
					key: upload.key,
					size: outputs[index].byteLength
				}))
			});
			return keys;
		} catch (error) {
			// Failed cleanup remains in the ledger; the cron retries until R2 confirms deletion.
			await ctx.runMutation(internal.storage.r2.markDeleting, { keys });
			throw error;
		}
	}
});

export const cleanupUploads = internalAction({
	args: { keys: v.array(v.string()) },
	returns: v.null(),
	handler: async (ctx, { keys }) => {
		for (const key of keys) {
			const upload = await ctx.runQuery(internal.storage.r2.getUpload, { key });
			if (!upload || upload.status !== 'deleting') continue;
			try {
				const storage = upload.bucket ? getTemporaryR2(upload.bucket) : r2;
				// Await the physical delete; queuing a component retry alone cannot prove absence.
				await storage.client.send(
					new DeleteObjectCommand({ Bucket: storage.config.bucket, Key: key })
				);
				await storage.deleteObject(ctx, key);
				await ctx.runMutation(internal.storage.r2.recordDeletionResult, { key, deleted: true });
			} catch (error) {
				console.error('R2 upload cleanup will retry', key, error);
				await ctx.runMutation(internal.storage.r2.recordDeletionResult, { key, deleted: false });
			}
		}
		return null;
	}
});

export const cleanupStaleUploads = internalAction({
	args: {},
	returns: v.null(),
	handler: async (ctx) => {
		const uploads = await ctx.runQuery(internal.storage.r2.getStaleUploads, {
			cutoff: Date.now() - STORAGE_CONFIG.uploadTtlMinutes * 60_000
		});
		await ctx.runMutation(internal.storage.r2.markDeleting, {
			keys: uploads.map((upload) => upload.key)
		});
		return null;
	}
});
