import { migrations } from './migrations.js';

import { normalizeOwnerId } from '../betterAuth/helpers/requireIdentity.js';

export const backfillStorageUploadOwnerIds = migrations.define({
	table: 'storageUploads',
	migrateOne: async (_ctx, upload) => {
		const ownerId = normalizeOwnerId(upload.ownerId);
		return ownerId === upload.ownerId ? undefined : { ownerId };
	}
});
