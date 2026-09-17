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
import type { Doc } from '../../../_generated/dataModel.js';
import type { MutationCtx } from '../../../_generated/server.js';
import type { BackendErrorData } from '../../../../shared/types/types.js';

type Product = Doc<'products'>;

type ResolvedImageKeys = { retained: string[]; imageKeys: string[] };

/** Inventory cannot be disabled or lowered below what checkout reservations hold. */
function assertStockRules(options: {
	trackInventory: boolean;
	inventory: number;
	reservedInventory: number;
}): void {
	if (!options.trackInventory && options.reservedInventory > 0) {
		throw new ConvexError<BackendErrorData>({
			code: 'CANNOT_DISABLE_INVENTORY_WITH_RESERVATIONS'
		});
	}
	if (options.trackInventory && options.inventory < options.reservedInventory) {
		throw new ConvexError<BackendErrorData>({ code: 'STOCK_BELOW_RESERVED' });
	}
}

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
	if (imageKeys.length > STORAGE_CONFIG.maxFilesPerUpload) {
		throw new ConvexError<BackendErrorData>({
			code: 'TOO_MANY_FILES',
			maxFiles: STORAGE_CONFIG.maxFilesPerUpload
		});
	}

	return { retained, imageKeys };
}

export const saveProduct = adminUploadMutation({
	rateLimit: { name: 'products:update' },
	args: {
		id: v.optional(v.id('products')),
		name: v.string(),
		description: v.string(),
		priceInCents: v.number(),
		trackInventory: v.boolean(),
		inventory: v.number(),
		compareAtPriceInCents: v.optional(v.number()),
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

		const reservedInventory = product ? product.reservedInventory : 0;
		assertStockRules({
			trackInventory: input.trackInventory,
			inventory: input.inventory,
			reservedInventory
		});

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

		const fields = {
			name: input.name,
			description: input.description,
			priceInCents: input.priceInCents,
			compareAtPriceInCents: input.compareAtPriceInCents,
			categoryId: input.categoryId,
			images: await resolveStoredFileUrls(imageKeys),
			imageKeys,
			storagePrefix: product?.storagePrefix ?? 'products',
			trackInventory: input.trackInventory,
			inventory: input.inventory,
			reservedInventory,
			upsellProductIds: product ? product.upsellProductIds : [],
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

		return {
			...(await ctx.db.get(productId))!,
			priceInCents: input.priceInCents,
			imageKeys,
			trackInventory: input.trackInventory,
			inventory: input.inventory,
			reservedInventory,
			upsellProductIds: fields.upsellProductIds
		};
	}
});
