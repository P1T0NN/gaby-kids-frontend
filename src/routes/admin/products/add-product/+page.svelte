<script lang="ts">
	// SVELTEKIT IMPORTS
	import { gotoParaglide } from '@/utils/gotoParaglide.js';

	// LIBRARIES
	import { api } from '@convex/_generated/api';
	import { m } from '@/lib/paraglide/messages';

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
	import { createProductVariantFormValue } from '@/features/productVariants/utils/productVariantFormValues.js';
	import { generateSlug } from '@/shared/utils/generateSlug.js';

	// COMPONENTS
	import AdminAddProductHeader from '@/components/pages/admin/add-product/admin-add-product-header.svelte';
	import ProductCategorySelector from '@/features/categories/components/product-category-selector.svelte';
	import ProductVariantsEditor from '@/features/productVariants/components/product-variants-editor/product-variants-editor.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import ButtonLink from '@/components/ui/custom-components/button-link/button-link.svelte';
	import Form from '@/components/ui/custom-components/form/form.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import { Spinner } from '@/components/ui/spinner/index.js';

	// TYPES
	import type {
		CustomFieldContext,
		MutationValues
	} from '@/components/ui/custom-components/form/formTypes.js';
	import type { PreviewFile } from '@/features/uploadFile/types/uploadFileTypes.js';
	import type { ProductVariantFormValue } from '@/shared/features/productVariants/types/productVariantTypes.js';

	let submitting = $state(false);
	let categoryId = $state('');
	let productVariantOptionNames = $state<string[]>([]);
	let productVariants = $state<ProductVariantFormValue[]>([createProductVariantFormValue([])]);
	let uploadFiles = $state<PreviewFile[]>([]);

	let values = $state<MutationValues<typeof api.tables.products.mutations.saveProduct.saveProduct>>(
		{
			active: true,
			trackInventory: false,
			ageGroup: DEFAULT_PRODUCT_AGE_GROUP,
			gender: DEFAULT_PRODUCT_GENDER
		}
	);
</script>

<SvelteHead title={m['AddProductPage.pageTitle']()} noindex />

{#snippet categoryField({ field, disabled, error }: CustomFieldContext)}
	<ProductCategorySelector
		id={field.name}
		bind:selectedId={categoryId}
		required
		{disabled}
		{error}
	/>
{/snippet}

{#snippet productVariantsField({ disabled, errors }: CustomFieldContext)}
	<ProductVariantsEditor
		bind:productVariants
		bind:productVariantOptionNames
		productSlug={generateSlug(String(values.name ?? ''))}
		{uploadFiles}
		trackInventory={values.trackInventory !== false}
		{disabled}
		{errors}
	/>
{/snippet}

<div class="mx-auto flex w-full max-w-4xl flex-col gap-6">
	<AdminAddProductHeader />

	<!-- eslint-disable svelte/no-navigation-without-resolve -->
	<Form
		function={api.tables.products.mutations.saveProduct.saveProduct}
		fields={createProductFields({ productVariantsField, categoryField })}
		bind:values
		bind:uploadFiles
		schema={saveProductFormSchema}
		uploadNamespace="products"
		resolveExtraFields={({ uploadedFiles }) =>
			buildSaveProductExtraFields({
				categoryId,
				status: values.active === true ? 'active' : 'draft',
				productVariantOptionNames,
				productVariants,
				uploadFiles,
				uploadedFiles
			})}
		bind:submitting
		onSuccess={() => gotoParaglide(ADMIN_PAGE_ENDPOINTS.PRODUCTS)}
		successMessage={m['AddProductPage.productAdded']()}
		errorMessage={m['AddProductPage.addError']()}
	>
		<div class="flex flex-wrap items-center justify-end gap-2">
			<p class="mr-auto text-sm text-muted-foreground">
				{values.active ? m['AddProductPage.activeHint']() : m['AddProductPage.draftHint']()}
			</p>
			<ButtonLink href={ADMIN_PAGE_ENDPOINTS.PRODUCTS} variant="outline">
				{m['AddProductPage.cancel']()}
			</ButtonLink>
			<Button type="submit" disabled={submitting}>
				{#if submitting}
					<Spinner />
				{/if}
				{m['AddProductPage.addProduct']()}
			</Button>
		</div>
	</Form>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
</div>
