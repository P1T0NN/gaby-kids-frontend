// LIBRARIES
import { AuditActions } from 'convex-audit-log';
import { ConvexError, v } from 'convex/values';

// BUILDERS
import { adminUploadMutation } from '../../../builders/convexFunctionBuilders.js';

// SCHEMAS
import { saveProductSchema } from '../../../../shared/features/products/schemas/productsSchemas.js';

// VALIDATORS
import {
	productAgeGroup,
	productGender,
	productResult,
	productStatus
} from '../validators/productValidators.js';
import { productVariantInput } from '../../productVariants/validators/productVariantValidators.js';

// HELPERS
import { validateProductCategory } from '../../categories/helpers/validateProductCategory.js';
import { logAuditEvent } from '../../../auditLogs/helpers/logAuditEvent.js';
import { deleteStoredFiles, resolveStoredFileUrls } from '../../../storage/r2.js';
import { resolveProductVariants } from '../../productVariants/helpers/resolveProductVariants.js';
import { generateSlug } from '../../../../shared/utils/generateSlug.js';

// TYPES
import type { Doc } from '../../../_generated/dataModel.js';
import type { MutationCtx } from '../../../_generated/server.js';
import type { BackendErrorData } from '../../../../shared/types/types.js';

type Product = Doc<'products'>;

type ResolvedImageKeys = { retained: string[]; imageKeys: string[] };

/** Keep an existing slug; new products get a generated one that has to be free. */
async function resolveProductSlug(
	ctx: MutationCtx,
	name: string,
	product: Product | null
): Promise<string> {
	const slug = product?.slug ?? generateSlug(name);
	if (!slug) throw new ConvexError<BackendErrorData>({ code: 'INVALID_PRODUCT_DATA' });

	if (!product) {
		const taken = await ctx.db
			.query('products')
			.withIndex('by_slug', (query) => query.eq('slug', slug))
			.unique();
		if (taken) throw new ConvexError<BackendErrorData>({ code: 'PRODUCT_SLUG_TAKEN' });
	}

	return slug;
}

/** Validate retained/uploaded keys and merge them into the stored gallery order. */
function resolveImageKeys(options: {
	retainedFiles: string[] | null | undefined;
	uploadedFiles: string[] | null | undefined;
	currentKeys: string[];
}): ResolvedImageKeys {
	const retained = options.retainedFiles ?? options.currentKeys;
	if (new Set(retained).size !== retained.length) {
		throw new ConvexError<BackendErrorData>({ code: 'DUPLICATE_RETAINED_IMAGE' });
	}
	if (retained.some((key) => !options.currentKeys.includes(key))) {
		throw new ConvexError<BackendErrorData>({ code: 'INVALID_RETAINED_IMAGE' });
	}
	if (options.uploadedFiles?.some((key) => !key.startsWith('products/'))) {
		throw new ConvexError<BackendErrorData>({ code: 'INVALID_UPLOAD_NAMESPACE' });
	}

	const imageKeys = [...retained, ...(options.uploadedFiles ?? [])];
	return { retained, imageKeys };
}

export const saveProduct = adminUploadMutation({
	rateLimit: { name: 'products:update' },
	args: {
		id: v.optional(v.id('products')),
		name: v.string(),
		description: v.string(),
		trackInventory: v.boolean(),
		categoryId: v.id('categories'),
		ageGroup: v.optional(productAgeGroup),
		gender: v.optional(productGender),
		productVariantOptionNames: v.array(v.string()),
		productVariants: v.array(productVariantInput),
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
		await validateProductCategory(
			ctx,
			input.categoryId,
			status === 'active' ? undefined : product?.categoryId
		);

		const slug = await resolveProductSlug(ctx, input.name, product);
		const currentKeys = product?.imageKeys ?? product?.images ?? [];
		const { retained, imageKeys } = resolveImageKeys({
			retainedFiles: args.retainedFiles,
			uploadedFiles: args.uploadedFiles,
			currentKeys
		});

		const libraryImageKeys = new Set(imageKeys);
		for (const productVariant of input.productVariants) {
			const hasForeignImage = productVariant.imageKeys.some((key) => !libraryImageKeys.has(key));
			if (
				hasForeignImage ||
				new Set(productVariant.imageKeys).size !== productVariant.imageKeys.length
			) {
				throw new ConvexError<BackendErrorData>({ code: 'INVALID_PRODUCT_VARIANT_IMAGE' });
			}
		}

		const { writes, caches } = await resolveProductVariants({
			ctx,
			productId: product?._id,
			input: input.productVariants,
			slug,
			trackInventory: input.trackInventory
		});

		const fields = {
			name: input.name,
			description: input.description,
			productVariantOptionNames: input.productVariantOptionNames,
			priceInCents: caches.priceInCents,
			compareAtPriceInCents: caches.compareAtPriceInCents,
			hasPriceRange: caches.hasPriceRange,
			categoryId: input.categoryId,
			ageGroup: input.ageGroup,
			gender: input.gender,
			images: await resolveStoredFileUrls(imageKeys),
			imageKeys,
			storagePrefix: product?.storagePrefix ?? 'products',
			trackInventory: input.trackInventory,
			upsellProductIds: product ? product.upsellProductIds : [],
			status
		};

		const productId = product?._id ?? (await ctx.db.insert('products', { ...fields, slug }));
		if (product) await ctx.db.patch(productId, fields);

		for (const insert of writes.inserts) {
			await ctx.db.insert('productVariants', { ...insert, productId });
		}
		for (const patch of writes.patches) {
			await ctx.db.patch(patch.id, patch.fields);
		}
		for (const variantId of writes.deletes) {
			await ctx.db.delete(variantId);
		}

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

		return (await ctx.db.get(productId))!;
	}
});
