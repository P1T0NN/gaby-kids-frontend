// LIBRARIES
import { api } from '@convex/_generated/api';
import { m } from '@/lib/paraglide/messages';
import { z } from 'zod';

// CONFIG
import {
	PRODUCT_AGE_GROUPS,
	PRODUCT_GENDERS
} from '@/shared/features/products/data/productsData.js';
import { PRODUCTS_CONFIG } from '@/shared/features/products/config.js';

// SCHEMAS
import { saveProductSchema } from '@/shared/features/products/schemas/productsSchemas.js';

// TYPES
import type { Snippet } from 'svelte';
import type {
	ProductAgeGroup,
	ProductGender
} from '@/shared/features/products/types/productsTypes.js';
import type { Id } from '@convex/_generated/dataModel';
import type {
	CustomFieldContext,
	FieldConfig,
	MutationValues
} from '@/components/ui/custom-components/form/formTypes.js';
import type { PreviewFile } from '@/features/uploadFile/types/uploadFileTypes.js';
import type { ProductVariantFormValue } from '@/shared/features/productVariants/types/productVariantTypes.js';

/** Client form schema: adds the product-level image requirement, then drops it from the payload. */
export const saveProductFormSchema = saveProductSchema
	.safeExtend({ images: z.array(z.string()).min(1, 'PRODUCT_IMAGES_REQUIRED') })
	.transform(({ images: _images, ...args }) => args);

const AGE_GROUP_LABELS = {
	kids: m['ProductsFeature.ProductAttributes.kids'],
	adults: m['ProductsFeature.ProductAttributes.adults']
} satisfies Record<ProductAgeGroup, () => string>;

const GENDER_LABELS = {
	unisex: m['ProductsFeature.ProductAttributes.unisex'],
	male: m['ProductsFeature.ProductAttributes.male'],
	female: m['ProductsFeature.ProductAttributes.female']
} satisfies Record<ProductGender, () => string>;

const AGE_GROUP_FIELD: FieldConfig = {
	kind: 'select',
	name: 'ageGroup',
	label: m['ProductsFeature.ProductAttributes.ageGroup'](),
	options: PRODUCT_AGE_GROUPS.map((ageGroup) => ({
		value: ageGroup,
		label: AGE_GROUP_LABELS[ageGroup]()
	}))
};

const GENDER_FIELD: FieldConfig = {
	kind: 'select',
	name: 'gender',
	label: m['ProductsFeature.ProductAttributes.gender'](),
	options: PRODUCT_GENDERS.map((gender) => ({
		value: gender,
		label: GENDER_LABELS[gender]()
	}))
};

/**
 * Maps form image references to stored keys. Retained previews already carry a
 * key; pending previews receive one from `uploadedFiles` in submit order.
 */
function buildProductVariantImageKeyMap(
	uploadFiles: readonly PreviewFile[],
	uploadedFiles: readonly string[]
): Map<string, string> {
	const keyByPreviewId = new Map<string, string>();
	let uploadedIndex = 0;

	for (const preview of uploadFiles) {
		if (preview.key) {
			keyByPreviewId.set(preview.id, preview.key);
			continue;
		}
		const key = uploadedFiles[uploadedIndex];
		uploadedIndex += 1;
		if (key) keyByPreviewId.set(preview.id, key);
	}

	return keyByPreviewId;
}

type SaveProductMutation = typeof api.tables.products.mutations.saveProduct.saveProduct;

export function createProductFields(options: {
	productVariantsField: Snippet<[CustomFieldContext]>;
	categoryField: Snippet<[CustomFieldContext]>;
}): FieldConfig[] {
	return [
		{
			kind: 'section',
			class: 'overflow-visible',
			title: m['AddProductPage.basicInfoSectionTitle'](),
			description: m['AddProductPage.basicInfoSectionDescription'](),
			fields: [
				{
					kind: 'input',
					name: 'name',
					label: m['AddProductPage.name'](),
					placeholder: m['AddProductPage.namePlaceholder'](),
					type: 'text',
					maxLength: 255,
					required: true
				},
				{
					kind: 'textarea',
					name: 'description',
					label: m['AddProductPage.description'](),
					placeholder: m['AddProductPage.descriptionPlaceholder'](),
					maxLength: 5_000,
					required: true
				},
				{
					kind: 'upload',
					name: 'images',
					label: m['AddProductPage.images'](),
					description: m['AddProductPage.imagesDescription'](),
					mode: 'multiple'
				},
				{
					kind: 'custom',
					name: 'categoryId',
					label: m['AddProductPage.categories'](),
					description: m['AddProductPage.categoriesDescription'](),
					required: true,
					render: options.categoryField
				},
				...(PRODUCTS_CONFIG.HAS_AGE_GROUP ? [AGE_GROUP_FIELD] : []),
				...(PRODUCTS_CONFIG.HAS_GENDER ? [GENDER_FIELD] : [])
			]
		},
		{
			kind: 'section',
			title: m['ProductVariantsFeature.ProductVariantsEditor.sectionTitle'](),
			description: m['ProductVariantsFeature.ProductVariantsEditor.sectionDescription'](),
			fields: [
				{
					kind: 'switch',
					name: 'trackInventory',
					label: m['AddProductPage.trackInventory'](),
					description: m['AddProductPage.trackInventoryDescription']()
				},
				{
					kind: 'custom',
					name: 'productVariants',
					render: options.productVariantsField
				}
			]
		},
		{
			kind: 'section',
			title: m['AddProductPage.visibilitySectionTitle'](),
			description: m['AddProductPage.visibilitySectionDescription'](),
			fields: [
				{
					kind: 'switch',
					name: 'active',
					label: m['AddProductPage.statusActive'](),
					description: m['AddProductPage.statusDescription']()
				}
			]
		}
	] satisfies FieldConfig[];
}

/** Extra saveProduct payload: resolved upload keys and the trimmed variant rows. */
export function buildSaveProductExtraFields(options: {
	categoryId: string;
	status: 'active' | 'draft';
	productVariantOptionNames: string[];
	productVariants: ProductVariantFormValue[];
	uploadFiles: readonly PreviewFile[];
	uploadedFiles: readonly string[];
}): MutationValues<SaveProductMutation> {
	const imageKeyByPreviewId = buildProductVariantImageKeyMap(
		options.uploadFiles,
		options.uploadedFiles
	);

	return {
		// SAFETY: the shared schema and Convex validate the selected category ID.
		categoryId: options.categoryId as Id<'categories'>,
		status: options.status,
		// Client-only field; `saveProductFormSchema` validates it and strips it from the payload.
		images: options.uploadFiles.map((preview) => preview.key ?? preview.id),
		productVariantOptionNames: options.productVariantOptionNames.map((optionName) =>
			optionName.trim()
		),
		productVariants: options.productVariants.map((productVariant) => ({
			id: productVariant.id,
			options: productVariant.options.map((option) => ({
				name: option.name.trim(),
				value: option.value.trim()
			})),
			sku: productVariant.sku.trim(),
			imageKeys: [
				...new Set(
					productVariant.imageKeys.flatMap((imageId) => {
						// Pending previews keep their id until the upload assigns the stored key.
						const key = imageKeyByPreviewId.get(imageId) ?? imageId;
						return key ? [key] : [];
					})
				)
			],
			// SAFETY: the shared schema rejects a blank price before the mutation runs.
			priceInCents: productVariant.priceInCents as number,
			compareAtPriceInCents: productVariant.compareAtPriceInCents,
			// SAFETY: the shared schema rejects blank stock before the mutation runs.
			inventory: productVariant.inventory as number
		}))
	};
}
