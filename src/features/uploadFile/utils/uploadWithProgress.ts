// TYPES
import type { FileUploadProgress } from '../types/uploadFileTypes.js';

export function uploadWithProgress(
	url: string,
	file: File,
	onProgress: (progress: FileUploadProgress) => void,
	errorMessage: string,
	cancelledMessage: string
): Promise<void> {
	return new Promise((resolve, reject) => {
		const request = new XMLHttpRequest();
		request.open('PUT', url);
		request.setRequestHeader('Content-Type', file.type);
		request.upload.addEventListener('progress', (event) => {
			onProgress({ loaded: event.loaded, total: event.lengthComputable ? event.total : file.size });
		});
		request.addEventListener('load', () => {
			const wasSuccessful = request.status >= 200 && request.status < 300;
			if (wasSuccessful) {
				onProgress({ loaded: file.size, total: file.size });
				resolve();
				return;
			}
			reject(new Error(`${errorMessage}: ${request.statusText || request.status}`));
		});
		request.addEventListener('error', () => reject(new Error(errorMessage)));
		request.addEventListener('abort', () => reject(new Error(cancelledMessage)));
		request.send(file);
	});
}
