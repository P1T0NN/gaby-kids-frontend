/// <reference types="vite/client" />
// @vitest-environment node
import { convexTest } from 'convex-test';
import r2Test from '@convex-dev/r2/test';
import actionRetrierTest from '@convex-dev/action-retrier/test';
import rateLimiterTest from '@convex-dev/rate-limiter/test';
import {
	DeleteObjectCommand,
	GetObjectCommand,
	HeadObjectCommand,
	PutObjectCommand,
	S3Client
} from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { afterEach, expect, test, vi } from 'vitest';
import schema from '../../src/convex/schema';
import { api, internal } from '../../src/convex/_generated/api';
import { STORAGE_CONFIG } from '../../src/shared/features/storage/config.js';

const modules = import.meta.glob('../../src/convex/**/*.ts');
afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	vi.useRealTimers();
});

async function setup(count = 1) {
	vi.useFakeTimers();
	const t = convexTest(schema, modules);
	r2Test.register(t);
	rateLimiterTest.register(t);
	actionRetrierTest.register(t, 'r2/actionRetrier');
	const owner = t.withIdentity({ subject: 'upload-owner', tokenIdentifier: 'upload-owner' });
	const other = t.withIdentity({ subject: 'other-user', tokenIdentifier: 'other-user' });
	const objects = new Map<string, Uint8Array>();
	const original = await sharp({
		create: { width: 20, height: 10, channels: 3, background: 'red' }
	})
		.png()
		.toBuffer();
	const uploads = await owner.mutation(api.storage.r2.generateUploadUrls, {
		namespace: 'products',
		files: Array.from({ length: count }, () => ({
			size: original.byteLength,
			contentType: 'image/png'
		}))
	});
	for (const upload of uploads) {
		const row = await t.query(internal.storage.r2.getUpload, { key: upload.key });
		objects.set(`test-private-uploads/${row!.temporaryKey}`, original);
	}
	const writes: string[] = [];
	const failures = { put: 0, delete: false };
	vi.spyOn(S3Client.prototype, 'send').mockImplementation(async (command) => {
		if (command instanceof GetObjectCommand) {
			const bytes = objects.get(`${command.input.Bucket}/${command.input.Key}`);
			return {
				ContentLength: bytes?.byteLength,
				Body: { transformToByteArray: async () => bytes }
			};
		}
		if (command instanceof PutObjectCommand) {
			writes.push(command.input.Key!);
			if (writes.length === failures.put) throw new Error('R2 PUT failed');
			// SAFETY: r2.store supplies its optimized Buffer as the SDK request body.
			objects.set(`${command.input.Bucket}/${command.input.Key}`, command.input.Body as Buffer);
			return {};
		}
		if (command instanceof DeleteObjectCommand) {
			if (failures.delete) throw new Error('R2 DELETE failed');
			objects.delete(`${command.input.Bucket}/${command.input.Key}`);
			return {};
		}
		if (command instanceof HeadObjectCommand) {
			return {
				ContentLength: objects.get(`${command.input.Bucket}/${command.input.Key}`)?.byteLength,
				ContentType: 'image/webp',
				LastModified: new Date()
			};
		}
		throw new Error('Unexpected SDK operation');
	});
	return { t, owner, other, objects, uploads, writes, failures, original };
}

test('processes a 20 MiB original by key without passing image bytes as action arguments', async () => {
	const { t, owner, objects, uploads, original } = await setup();
	const large = new Uint8Array(STORAGE_CONFIG.maxFileSizeBytes);
	large.set(original);
	const key = uploads[0].key;
	const row = await t.query(internal.storage.r2.getUpload, { key });
	objects.set(`test-private-uploads/${row!.temporaryKey}`, large);
	await t.run(async (ctx) => {
		for (const objectKey of [key, row!.temporaryKey!]) {
			const record = await ctx.db
				.query('storageUploads')
				.withIndex('by_key', (q) => q.eq('key', objectKey))
				.unique();
			await ctx.db.patch(record!._id, { expectedSize: large.byteLength });
		}
	});
	await expect(owner.action(api.storage.actions.processUploads, { keys: [key] })).resolves.toEqual([
		key
	]);
	expect(objects.get(`test-bucket/${key}`)!.byteLength).toBeLessThan(2 * 1024 * 1024);
});

test('reserves private originals and final keys, enforces limits and ownership', async () => {
	const { t, owner, other, uploads } = await setup();
	expect(uploads[0].url).toContain('test-private-uploads');
	expect(new URL(uploads[0].url).hostname).toContain('test-temp-account');
	expect(new URL(uploads[0].url).searchParams.get('X-Amz-Credential')).toContain(
		'test-temp-access-key/'
	);
	expect(uploads[0].url).toContain('X-Amz-Expires=300');
	expect(new URL(uploads[0].url).searchParams.get('X-Amz-SignedHeaders')).toContain(
		'content-length'
	);
	await expect(
		other.action(api.storage.actions.processUploads, { keys: [uploads[0].key] })
	).rejects.toMatchObject({ data: { code: 'UPLOAD_NOT_FOUND' } });
	await expect(
		t.action(api.storage.actions.processUploads, { keys: [uploads[0].key] })
	).rejects.toMatchObject({ data: { code: 'UNAUTHENTICATED' } });
	await expect(
		other.mutation(api.storage.r2.deleteObject, { key: uploads[0].key })
	).rejects.toMatchObject({ data: { code: 'UPLOAD_NOT_FOUND' } });
	await expect(
		owner.mutation(api.storage.r2.generateUploadUrls, {
			files: [{ size: STORAGE_CONFIG.maxFileSizeBytes + 1, contentType: 'image/png' }]
		})
	).rejects.toMatchObject({ data: { code: 'INVALID_UPLOAD' } });
	await expect(
		owner.mutation(api.storage.r2.generateUploadUrls, {
			files: Array.from({ length: 3 }, () => ({
				size: STORAGE_CONFIG.maxFileSizeBytes,
				contentType: 'image/png'
			}))
		})
	).rejects.toMatchObject({ data: { code: 'UPLOAD_BATCH_TOO_LARGE' } });
});

test('optimizes on the server, deletes originals and keeps final images claimable', async () => {
	const { t, owner, objects, uploads } = await setup(2);
	const keys = uploads.map((upload) => upload.key);
	await expect(owner.action(api.storage.actions.processUploads, { keys })).resolves.toEqual(keys);
	expect([...objects.keys()]).toEqual(keys.map((key) => `test-bucket/${key}`));
	for (const key of keys) {
		expect(await sharp(objects.get(`test-bucket/${key}`)).metadata()).toMatchObject({
			format: 'webp',
			width: 20,
			height: 20
		});
		expect((await t.query(internal.storage.r2.getUpload, { key }))?.status).toBe('uploaded');
	}
});

test('one malformed original prevents all final writes and cleanup removes the batch', async () => {
	const { t, owner, objects, uploads, writes, original } = await setup(2);
	const second = await t.query(internal.storage.r2.getUpload, { key: uploads[1].key });
	objects.set(`test-private-uploads/${second!.temporaryKey}`, new Uint8Array(original.byteLength));
	await expect(
		owner.action(api.storage.actions.processUploads, { keys: uploads.map((upload) => upload.key) })
	).rejects.toMatchObject({ data: { code: 'INVALID_UPLOAD' } });
	expect(writes).toHaveLength(0);
	await t.finishAllScheduledFunctions(vi.runAllTimers);
	expect(objects.size).toBe(0);
});

test('partial final upload failure removes all originals and any already-written WebPs', async () => {
	const { t, owner, objects, uploads, failures } = await setup(2);
	failures.put = 2;
	await expect(
		owner.action(api.storage.actions.processUploads, { keys: uploads.map((upload) => upload.key) })
	).rejects.toThrow('R2 PUT failed');
	await t.finishAllScheduledFunctions(vi.runAllTimers);
	expect(objects.size).toBe(0);
});

test('failed product submission cleanup is repeatable and never deletes claimed images', async () => {
	const { t, owner, objects, uploads } = await setup(2);
	await owner.action(api.storage.actions.processUploads, {
		keys: uploads.map((upload) => upload.key)
	});
	// A successful product transaction consumes the final-image ledger record.
	await t.run(async (ctx) => {
		const row = await ctx.db
			.query('storageUploads')
			.withIndex('by_key', (q) => q.eq('key', uploads[0].key))
			.unique();
		await ctx.db.delete(row!._id);
	});
	for (const upload of uploads) {
		await owner.mutation(api.storage.r2.deleteObject, { key: upload.key });
		await owner.mutation(api.storage.r2.deleteObject, { key: upload.key });
	}
	await t.finishAllScheduledFunctions(vi.runAllTimers);
	expect([...objects.keys()]).toEqual([`test-bucket/${uploads[0].key}`]);
});

test('retains records after deletion failure and catches originals uploaded late after cleanup', async () => {
	const { t, owner, objects, uploads, failures, original } = await setup();
	const row = await t.query(internal.storage.r2.getUpload, { key: uploads[0].key });
	await owner.mutation(api.storage.r2.deleteObject, { key: uploads[0].key });
	failures.delete = true;
	vi.spyOn(console, 'error').mockImplementation(() => {});
	await t.finishAllScheduledFunctions(vi.runAllTimers);
	expect((await t.query(internal.storage.r2.getUpload, { key: row!.temporaryKey! }))?.status).toBe(
		'deleting'
	);
	failures.delete = false;
	await t.action(internal.storage.actions.cleanupUploads, {
		keys: [uploads[0].key, row!.temporaryKey!]
	});
	expect(objects.size).toBe(0);
	// A PUT that finishes after the first DELETE must still be found by the expiry sweep.
	objects.set(`test-private-uploads/${row!.temporaryKey}`, original);
	vi.advanceTimersByTime(STORAGE_CONFIG.uploadTtlMinutes * 60_000 + 1);
	await t.action(internal.storage.actions.cleanupStaleUploads, {});
	await t.finishAllScheduledFunctions(vi.runAllTimers);
	expect(objects.size).toBe(0);
	expect(await t.query(internal.storage.r2.getUpload, { key: uploads[0].key })).toBeNull();
	expect(await t.query(internal.storage.r2.getUpload, { key: row!.temporaryKey! })).toBeNull();
});

test('a full batch of failed deletes cannot starve later abandoned files', async () => {
	const { t, failures } = await setup();
	const createdAt = Date.now() - (STORAGE_CONFIG.uploadTtlMinutes + 1) * 60_000;
	const keys = Array.from(
		{ length: STORAGE_CONFIG.cleanupBatchSize },
		(_, index) => `failed-${index}`
	);
	await t.run(async (ctx) => {
		for (const key of [...keys, 'later-upload']) {
			await ctx.db.insert('storageUploads', {
				key,
				ownerId: 'upload-owner',
				status: 'deleting',
				expectedSize: 1,
				expectedContentType: 'image/png',
				createdAt: createdAt + (key === 'later-upload' ? 1 : 0)
			});
		}
	});
	failures.delete = true;
	vi.spyOn(console, 'error').mockImplementation(() => {});
	await t.action(internal.storage.actions.cleanupUploads, { keys });
	const stale = await t.query(internal.storage.r2.getStaleUploads, {
		cutoff: Date.now() - STORAGE_CONFIG.uploadTtlMinutes * 60_000
	});
	expect(stale.map((upload) => upload.key)).toEqual(['later-upload']);
	expect(await t.query(internal.storage.r2.getUpload, { key: keys[0] })).not.toBeNull();
});

test('cancelled processing cannot commit and its late final write is removed by the cron', async () => {
	const { t, owner, uploads, objects, original } = await setup();
	await owner.mutation(internal.storage.r2.beginProcessing, { keys: [uploads[0].key] });
	await expect(
		owner.mutation(internal.storage.r2.beginProcessing, { keys: [uploads[0].key] })
	).rejects.toMatchObject({ data: { code: 'UPLOAD_NOT_FOUND' } });
	await owner.mutation(api.storage.r2.deleteObject, { key: uploads[0].key });
	await t.finishAllScheduledFunctions(vi.runAllTimers);
	objects.set(`test-bucket/${uploads[0].key}`, original);
	await expect(
		owner.mutation(internal.storage.r2.completeProcessing, {
			files: [{ key: uploads[0].key, size: original.byteLength }]
		})
	).rejects.toMatchObject({ data: { code: 'UPLOAD_NOT_FOUND' } });
	vi.advanceTimersByTime(STORAGE_CONFIG.uploadTtlMinutes * 60_000 + 1);
	await t.action(internal.storage.actions.cleanupStaleUploads, {});
	await t.finishAllScheduledFunctions(vi.runAllTimers);
	expect(objects.size).toBe(0);
});
