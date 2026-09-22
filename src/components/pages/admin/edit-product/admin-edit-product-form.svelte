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
		buildSaveProductExtraFields,
		createProductFields,
		saveProductFormSchema
	} from '@/features/products/forms/createProductForm.js';
	import { toProductVariantFormValue } from '@/features/productVariants/utils/toProductVariantFormValue.js';

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

	// TYPES
	import type { ProductDetail } from '@/features/productVariants/utils/toProductVariantFormValue.js';
	import type { CustomFieldContext } from '@/components/ui/custom-components/form/formTypes.js';
	import type { PreviewFile } from '@/features/uploadFile/types/uploadFileTypes.js';
	import type { ProductVariantFormValue } from '@/shared/features/productVariants/types/productVariantTypes.js';

	let { product }: { product: ProductDetail } = $props();

	const initialProduct = untrack(() => product);

	let submitting = $state(false);
	let categoryId = $state<string>(initialProduct.categoryId);

	let productVariantOptionNames = $state<string[]>([...initialProduct.productVariantOptionNames]);
	let productVariants = $state<ProductVariantFormValue[]>(
		initialProduct.productVariants.map((productVariant, index) =>
			toProductVariantFormValue({ productVariant, index, slug: initialProduct.slug })
		)
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

{#snippet categoryField({ field, disabled, error }: CustomFieldContext)}
	<ProductCategorySelector
		id={field.name}
		bind:selectedId={categoryId}
		initialCategory={initialProduct.categoryOption}
		required
		{disabled}
		{error}
	/>
{/snippet}

{#snippet productVariantsField({ disabled, errors }: CustomFieldContext)}
	<ProductVariantsEditor
		bind:productVariants
		bind:productVariantOptionNames
		productSlug={initialProduct.slug}
		{uploadFiles}
		trackInventory={formChanges.values.trackInventory !== false}
		{disabled}
		{errors}
	/>
{/snippet}

<Form
	function={api.tables.products.mutations.saveProduct.saveProduct}
	fields={createProductFields({ productVariantsField, categoryField })}
	schema={saveProductFormSchema}
	uploadNamespace="products"
	bind:values={formChanges.values}
	bind:uploadFiles
	bind:submitting
	resetOnSuccess={false}
	resolveExtraFields={({ uploadedFiles }) =>
		buildSaveProductExtraFields({
			categoryId,
			status: formChanges.values.active === true ? 'active' : 'draft',
			productVariantOptionNames,
			productVariants,
			uploadFiles,
			uploadedFiles
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
