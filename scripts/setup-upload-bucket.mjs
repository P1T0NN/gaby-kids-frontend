/** Run with bun: provision the private R2 originals bucket and its cleanup fallback. */
import {
	S3Client,
	CreateBucketCommand,
	HeadBucketCommand,
	GetBucketLifecycleConfigurationCommand,
	PutBucketLifecycleConfigurationCommand,
	PutBucketCorsCommand
} from '@aws-sdk/client-s3';

const bucket = process.env.STORAGE_TEMP_BUCKET_NAME;
if (!bucket || bucket === process.env.STORAGE_BUCKET_NAME)
	throw new Error('A separate temporary bucket is required.');
if (
	!process.env.STORAGE_TEMP_ENDPOINT ||
	!process.env.STORAGE_TEMP_ACCESS_KEY_ID ||
	!process.env.STORAGE_TEMP_SECRET_ACCESS_KEY
)
	throw new Error('All four STORAGE_TEMP_* environment variables are required.');
const client = new S3Client({
	region: 'auto',
	endpoint: process.env.STORAGE_TEMP_ENDPOINT,
	credentials: {
		accessKeyId: process.env.STORAGE_TEMP_ACCESS_KEY_ID,
		secretAccessKey: process.env.STORAGE_TEMP_SECRET_ACCESS_KEY
	}
});
try {
	await client.send(new HeadBucketCommand({ Bucket: bucket }));
	console.log(`Using existing bucket ${bucket}; ensure public access remains disabled.`);
} catch (error) {
	// R2 can hide a missing bucket behind 403; CreateBucket resolves whether provisioning is allowed.
	if (![403, 404].includes(error.$metadata?.httpStatusCode)) throw error;
	await client.send(new CreateBucketCommand({ Bucket: bucket }));
	console.log(`Created private bucket ${bucket}.`);
}
let rules = [];
try {
	rules =
		(await client.send(new GetBucketLifecycleConfigurationCommand({ Bucket: bucket }))).Rules ?? [];
} catch (error) {
	if (error.$metadata?.httpStatusCode !== 404) throw error;
}
await client.send(
	new PutBucketLifecycleConfigurationCommand({
		Bucket: bucket,
		LifecycleConfiguration: {
			Rules: [
				...rules.filter((rule) => rule.ID !== 'expire-originals'),
				{
					ID: 'expire-originals',
					Status: 'Enabled',
					Filter: { Prefix: 'originals/' },
					Expiration: { Days: 1 },
					AbortIncompleteMultipartUpload: { DaysAfterInitiation: 1 }
				}
			]
		}
	})
);
const origins = [
	...new Set(
		[process.env.PUBLIC_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'].filter(Boolean)
	)
];
await client.send(
	new PutBucketCorsCommand({
		Bucket: bucket,
		CORSConfiguration: {
			CORSRules: [
				{
					AllowedOrigins: origins,
					AllowedMethods: ['PUT'],
					AllowedHeaders: ['content-type'],
					MaxAgeSeconds: 300
				}
			]
		}
	})
);
console.log(
	`Lifecycle and upload CORS configured. Set STORAGE_TEMP_BUCKET_NAME=${bucket} on Convex.`
);
