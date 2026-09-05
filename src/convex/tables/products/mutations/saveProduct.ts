// LIBRARIES
import { AuditActions } from 'convex-audit-log';
import { ConvexError, v } from 'convex/values';

// BUILDERS
import { adminUploadMutation } from '../../../builders/convexFunctionBuilders.js';

// CONFIG
import { STORAGE_CONFIG } from '../../../../shared/features/storage/config.js';

// SCHEMAS
import { saveProductSchema } from '../../../../shared/features/products/schemas/productsSchemas.js';

// VALIDATORS
import { productResult, productStatus } from '../validators/productValidators.js';

// HELPERS
import { validateProductCategory } from '../../categories/helpers/validateProductCategory.js';
import { logAuditEvent } from '../../../auditLogs/helpers/logAuditEvent.js';
import { deleteStoredFiles, resolveStoredFileUrls } from '../../../storage/r2.js';
import { generateSlug } from '../../../../shared/utils/generateSlug.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

export const saveProduct = adminUploadMutation({
	rateLimit: { name: 'products:update' },
	args: {
		id: v.optional(v.id('products')),
		name: v.string(),
		description: v.string(),
		priceInCents: v.number(),
		categoryId: v.id('categories'),
		status: v.optional(productStatus)
	},
	returns: productResult,
	handler: async (ctx, args) => {
		const parsed = saveProductSchema.safeParse(args);
		if (!parsed.success) {
			throw new ConvexError<BackendErrorData>({ code: 'INVALID_PRODUCT_DATA' });
		}
		const input = parsed.data;
		const product = args.id ? await ctx.db.get(args.id) : null;
		if (args.id && !product) throw new ConvexError<BackendErrorData>({ code: 'PRODUCT_NOT_FOUND' });
		const status = input.status ?? product?.status ?? 'draft';
		const priceInCents = input.priceInCents;
		await validateProductCategory(
			ctx,
			input.categoryId,
			status === 'active' ? undefined : product?.categoryId
		);
		const slug = product?.slug ?? generateSlug(input.name);
		if (!slug) throw new ConvexError<BackendErrorData>({ code: 'INVALID_PRODUCT_DATA' });
		if (!product) {
			const taken = await ctx.db
				.query('products')
				.withIndex('by_slug', (q) => q.eq('slug', slug))
				.unique();
			if (taken) throw new ConvexError<BackendErrorData>({ code: 'PRODUCT_SLUG_TAKEN' });
		}
		const currentKeys = product?.imageKeys ?? product?.images ?? [];
		const retained = args.retainedFiles ?? currentKeys;
		if (new Set(retained).size !== retained.length)
			throw new ConvexError<BackendErrorData>({ code: 'DUPLICATE_RETAINED_IMAGE' });
		const hasUnknownImage = retained.some((key) => !currentKeys.includes(key));
		if (hasUnknownImage)
			throw new ConvexError<BackendErrorData>({ code: 'INVALID_RETAINED_IMAGE' });
		const hasForeignUpload = args.uploadedFiles?.some((key) => !key.startsWith('products/'));
		if (hasForeignUpload)
			throw new ConvexError<BackendErrorData>({ code: 'INVALID_UPLOAD_NAMESPACE' });
		const imageKeys = [...retained, ...(args.uploadedFiles ?? [])];
		if (imageKeys.length > STORAGE_CONFIG.maxFilesPerUpload)
			throw new ConvexError<BackendErrorData>({
				code: 'TOO_MANY_FILES',
				maxFiles: STORAGE_CONFIG.maxFilesPerUpload
			});
		const fields = {
			name: input.name,
			description: input.description,
			priceInCents,
			categoryId: input.categoryId,
			images: await resolveStoredFileUrls(imageKeys),
			imageKeys,
			storagePrefix: product?.storagePrefix ?? 'products',
			status
		};
		const productId = product?._id ?? (await ctx.db.insert('products', { ...fields, slug }));
		if (product) await ctx.db.patch(productId, fields);
		await deleteStoredFiles(
			ctx,
			currentKeys.filter((key) => !retained.includes(key))
		);
		await logAuditEvent(ctx, ctx.identity, {
			action: product ? AuditActions.RECORD_UPDATED : AuditActions.RECORD_CREATED,
			resourceType: 'products',
			resourceId: productId,
			severity: 'info'
		});
		return { ...(await ctx.db.get(productId))!, priceInCents, imageKeys };
	}
});
