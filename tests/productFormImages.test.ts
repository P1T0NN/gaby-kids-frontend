// @vitest-environment node
import { expect, test } from 'vitest';
import {
	buildSaveProductExtraFields,
	saveProductFormSchema
} from '../src/features/products/forms/createProductForm.js';
import { createProductVariantFormValue } from '../src/features/productVariants/utils/productVariantFormValues.js';

const variant = {
	...createProductVariantFormValue([]),
	priceInCents: 100,
	imageKeys: ['removed-key', 'pending', 'kept-key', 'removed-preview', 'kept-key']
};
const options: Parameters<typeof buildSaveProductExtraFields>[0] = {
	categoryIds: ['category'],
	status: 'draft',
	productVariantOptionNames: [],
	productVariants: [variant],
	uploadFiles: [
		{ id: 'kept-key', key: 'kept-key', url: 'https://example.com/image.webp' },
		{ id: 'pending', url: 'blob:pending', file: new File(['image'], 'photo.png') }
	],
	uploadedFiles: []
};

test('removed stored and pending images are excluded before and after upload', () => {
	for (const uploadedFiles of [[], ['products/new.webp']]) {
		const payload = buildSaveProductExtraFields({ ...options, uploadedFiles });
		expect(payload.productVariants?.[0].imageKeys).toEqual([
			uploadedFiles[0] ?? 'pending',
			'kept-key'
		]);
	}
});

test('removing the last assigned image shows the variant field error before upload', () => {
	const payload = buildSaveProductExtraFields({
		...options,
		productVariants: [{ ...variant, imageKeys: ['removed-key', 'removed-preview'] }]
	});
	const parsed = saveProductFormSchema.safeParse({
		...payload,
		name: 'Product',
		description: 'Details',
		trackInventory: false
	});
	if (parsed.success) throw new Error('Expected a missing variant image to fail validation');
	expect(parsed.error.issues).toEqual([
		expect.objectContaining({
			path: ['productVariants', 0, 'imageKeys'],
			message: 'PRODUCT_VARIANT_IMAGE_REQUIRED'
		})
	]);
});
