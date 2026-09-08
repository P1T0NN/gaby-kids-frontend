import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url))
		}
	},
	test: {
		environment: 'edge-runtime',
		include: ['tests/**/*.test.ts', 'src/convex/**/*.test.ts'],
		env: {
			RESEND_API_KEY: 'test-resend-key',
			STORAGE_BUCKET_NAME: 'test-bucket',
			STORAGE_ENDPOINT: 'https://test-account.r2.cloudflarestorage.com',
			STORAGE_ACCESS_KEY_ID: 'test-access-key',
			STORAGE_SECRET_ACCESS_KEY: 'test-secret-key',
			STORAGE_PUBLIC_URL: 'https://cdn.example.com'
		}
	}
});
