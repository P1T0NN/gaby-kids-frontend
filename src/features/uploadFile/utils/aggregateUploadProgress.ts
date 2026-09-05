import type { FileUploadProgress } from '../types/uploadFileTypes.js';

export function aggregateUploadProgress(files: FileUploadProgress[]): number {
	const total = files.reduce((sum, file) => sum + file.total, 0);
	if (total === 0) return 0;
	const loaded = files.reduce((sum, file) => sum + Math.min(file.loaded, file.total), 0);
	return Math.round((loaded / total) * 100);
}
