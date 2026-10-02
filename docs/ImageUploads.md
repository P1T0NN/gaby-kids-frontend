# Image uploads

The browser sends originals directly to a private R2 bucket. Convex receives only
keys, downloads originals in its Node action, validates them with `sharp`, and
produces square WebPs up to 1920px and 2 MiB. Original uploads are limited to
20 MiB each and 50 MiB combined per submission. Convex file storage is not used.

## Private bucket setup

Create the separate `gaby-kids-temporary` bucket. Leave both public access options
(r2.dev and custom domains) disabled. The temporary credentials need Object Read
& Write access to this bucket.

Set all four variables in `.env.local` and on the matching Convex deployment:

```env
STORAGE_TEMP_BUCKET_NAME=gaby-kids-temporary
STORAGE_TEMP_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
STORAGE_TEMP_ACCESS_KEY_ID=<R2_ACCESS_KEY_ID>
STORAGE_TEMP_SECRET_ACCESS_KEY=<R2_SECRET_ACCESS_KEY>
```

Use the S3 API endpoint and credentials for the temporary bucket. The endpoint
can match `STORAGE_ENDPOINT` when both buckets belong to the same R2 account.
Credentials can match the existing pair if they have access to both buckets;
otherwise use a separate pair scoped to the temporary bucket. There is no
temporary public URL variable. Existing `STORAGE_*` variables still configure
the final-image bucket. The app refuses to use that bucket for originals.

Run `bun scripts/setup-upload-bucket.mjs` with credentials that can configure the
private bucket. It preserves unrelated lifecycle rules, expires `originals/`
objects after one day, aborts incomplete multipart uploads after one day, and
configures PUT CORS for `PUBLIC_ORIGIN` and the local development origins.
Include every deployed frontend origin in the private bucket's CORS policy.

If credentials are limited to object access, configure lifecycle and CORS in
Cloudflare's bucket Settings instead. Use Standard storage for this bucket.
Cloudflare lifecycle deletion is asynchronous, so its one-day expiry is a
fallback rather than an exact deletion deadline.

## Cleanup guarantees

- Every original and planned WebP key has a ledger record before upload begins.
- The server optimizes the entire batch before writing any final images.
- Originals are physically deleted before the processing call succeeds.
- A failed upload, conversion, final write, or product/category save queues cleanup.
- Only a successful product/category save consumes the final-image records.
  Cleanup cannot delete a file already claimed by a successful transaction.
- Cleanup records survive failed physical deletes. The five-minute cron retries
  stale entries in bounded batches until R2 confirms deletion.
- Records are retained for at least one hour, longer than the five-minute signed
  upload URLs and ten-minute Node action timeout. A second delete catches late
  uploads or writes that finish after cancellation.
- The private bucket's lifecycle rule also removes abandoned originals if the
  application or cleanup scheduler is unavailable.

Files may remain temporarily during a storage outage. Their cleanup records must
remain until deletion succeeds; do not manually purge `deleting` records.

## Verification

Run `bun run test:convex tests/convex/storageCleanup.test.ts
tests/uploadFile/serverOptimizeToWebp.test.ts`. Tests cover server optimization,
ownership, limits, invalid batches, partial writes, repeatable cleanup, claimed
images, failed deletions, late uploads, and cancelled processing.

For a live check, add a product with a JPEG or PNG. The product should reference
only WebPs; the private bucket should contain no originals after success. Retry
with a corrupt image and confirm the error toast and cleanup. Close the tab while
uploading and confirm the abandoned entries disappear after the grace period
and a cron run. Bucket lifecycle configuration is required for the independent
fallback.
