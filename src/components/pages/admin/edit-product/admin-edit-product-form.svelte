<script lang="ts">
	// SVELTEKIT IMPORTS
	import { gotoParaglide } from '@/utils/gotoParaglide.js';
	import { untrack } from 'svelte';

	// LIBRARIES
	import { api } from '@convex/_generated/api';

	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';
	import {
		DEFAULT_PRODUCT_AGE_GROUP,
		DEFAULT_PRODUCT_GENDER
	} from '@/shared/features/products/config.js';

	// UTILS
	import {
		buildSaveProductArgs,
		createProductFields
	} from '@/features/products/forms/createProductForm.js';
	import { formatProductVariantFormPrice } from '@/features/productVariants/utils/productVariantFormValues.js';

	// COMPONENTS
	import ProductCategorySelector from '@/features/categories/components/product-category-selector.svelte';
	import ProductVariantsEditor from '@/features/productVariants/components/product-variants-editor/product-variants-editor.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import ButtonLink from '@/components/ui/custom-components/button-link/button-link.svelte';
	import Form from '@/components/ui/custom-components/form/form.svelte';
	import { Spinner } from '@/components/ui/spinner/index.js';
	import { m } from '@/lib/paraglide/messages';

	// HOOKS
	import { useFormChanges } from '@/hooks/useFormChanges.svelte.js';

	// SCHEMAS
	import { saveProductSchema } from '@/shared/features/products/schemas/productsSchemas.js';

	// TYPES
	import type { CustomFieldContext } from '@/components/ui/custom-components/form/formTypes.js';
	import type { PreviewFile } from '@/features/uploadFile/types/uploadFileTypes.js';
	import type { ProductVariantFormValue } from '@/shared/features/productVariants/types/productVariantTypes.js';
	import type { FunctionReturnType } from 'convex/server';

	type Product = FunctionReturnType<
		typeof api.tables.products.queries.fetchProductById.fetchProductById
	>;

	let { product }: { product: Product } = $props();

	const initialProduct = untrack(() => product);

	let submitting = $state(false);
	let categoryId = $state<string>(initialProduct.categoryId);

	function toProductVariantFormValue(
		productVariant: Product['productVariants'][number]
	): ProductVariantFormValue {
		const regularPriceInCents = productVariant.compareAtPriceInCents ?? productVariant.priceInCents;
		const discountedPriceInCents =
			productVariant.compareAtPriceInCents === undefined ? undefined : productVariant.priceInCents;

		return {
			id: productVariant._id,
			options: productVariant.options.map((option) => ({ ...option })),
			sku: productVariant.sku,
			imageKeys: [...productVariant.imageKeys],
			price: formatProductVariantFormPrice(regularPriceInCents),
			discountedPrice: formatProductVariantFormPrice(discountedPriceInCents),
			inventory: String(productVariant.inventory),
			reservedInventory: productVariant.reservedInventory
		};
	}

	// Show the error as soon as any submit attempt failed, even when native
	// validation stopped the form before the schema ran.
	function categoryFieldError(fieldErrors: Readonly<Record<string, string>>): string {
		if (categoryId) return '';
		return (
			fieldErrors.categoryId ??
			(Object.keys(fieldErrors).length > 0 ? m['ValidationMessages.requiredValue']() : '')
		);
	}

	let productVariantOptionNames = $state<string[]>([...initialProduct.productVariantOptionNames]);
	let productVariants = $state<ProductVariantFormValue[]>(
		initialProduct.productVariants.map(toProductVariantFormValue)
	);

	const formChanges = useFormChanges(() => ({
		id: initialProduct._id,
		name: initialProduct.name,
		description: initialProduct.description,
		trackInventory: initialProduct.trackInventory,
		ageGroup: initialProduct.ageGroup ?? DEFAULT_PRODUCT_AGE_GROUP,
		gender: initialProduct.gender ?? DEFAULT_PRODUCT_GENDER,
		active: initialProduct.status === 'active'
	}));

	let uploadFiles = $state<PreviewFile[]>(
		initialProduct.imageKeys.map((key, index) => ({
			id: key,
			key,
			url: initialProduct.images[index] ?? ''
		}))
	);
</script>

{#snippet categoryField({ field, disabled, errors }: CustomFieldContext)}
	<ProductCategorySelector
		id={field.name}
		bind:selectedId={categoryId}
		initialCategory={initialProduct.categoryOption}
		required
		{disabled}
		error={categoryFieldError(errors)}
	/>
{/snippet}

{#snippet productVariantsField({ disabled, errors }: CustomFieldContext)}
	<ProductVariantsEditor
		bind:productVariants
		bind:productVariantOptionNames
		{uploadFiles}
		trackInventory={formChanges.values.trackInventory !== false}
		{disabled}
		{errors}
	/>
{/snippet}

<Form
	function={api.tables.products.mutations.saveProduct.saveProduct}
	fields={createProductFields({ productVariantsField, categoryField })}
	schema={saveProductSchema}
	uploadNamespace="products"
	bind:values={formChanges.values}
	bind:uploadFiles
	bind:submitting
	resetOnSuccess={false}
	prepareArgs={({ values, uploadedFiles }) =>
		buildSaveProductArgs({
			values,
			categoryId,
			productVariantOptionNames,
			productVariants,
			uploadFiles,
			uploadedFiles,
			id: initialProduct._id
		})}
	onSuccess={() => gotoParaglide(ADMIN_PAGE_ENDPOINTS.PRODUCTS)}
	successMessage={m['AdminEditProductPage.productUpdated']()}
	errorMessage={m['AdminEditProductPage.updateError']()}
>
	<div class="flex flex-wrap justify-end gap-2">
		<ButtonLink href={ADMIN_PAGE_ENDPOINTS.PRODUCTS} variant="outline">
			{m['AdminEditProductPage.cancel']()}
		</ButtonLink>
		<Button type="submit" disabled={submitting}>
			{#if submitting}
				<Spinner />
			{/if}
			{m['AdminEditProductPage.saveChanges']()}
		</Button>
	</div>
</Form>
