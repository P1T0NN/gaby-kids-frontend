import { describe, expect, it } from 'vitest';
import { aggregateUploadProgress } from '../../src/features/uploadFile/utils/aggregateUploadProgress.js';
import { getUploadContentType } from '../../src/features/uploadFile/utils/uploadWithProgress.js';

it.each(['image/png', '', 'application/octet-stream', 'image/x-png'])(
	'uses a consistent PNG upload MIME type when the browser reports %s',
	(type) => {
		expect(getUploadContentType(new File(['image'], 'photo.PNG', { type }))).toBe('image/png');
	}
);

it('preserves other explicit MIME types and does not guess unknown extensions', () => {
	expect(getUploadContentType(new File(['text'], 'photo.png', { type: 'text/plain' }))).toBe(
		'text/plain'
	);
	expect(getUploadContentType(new File(['image'], 'photo', { type: '' }))).toBe('');
	expect(getUploadContentType(new File(['image'], 'photo.jpg', { type: 'image/jpeg' }))).toBe(
		'image/jpeg'
	);
});

describe('aggregateUploadProgress', () => {
	it('weights progress by file size', () => {
		expect(
			aggregateUploadProgress([
				{ loaded: 25, total: 100 },
				{ loaded: 100, total: 100 }
			])
		).toBe(63);
	});
});
