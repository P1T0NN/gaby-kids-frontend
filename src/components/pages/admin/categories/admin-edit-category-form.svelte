<script lang="ts">
	// SVELTEKIT IMPORTS
	import { goto } from '$app/navigation';
	import { untrack } from 'svelte';

	// LIBRARIES
	import { api } from '@convex/_generated/api';
	import { m } from '@/lib/paraglide/messages';

	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import Form from '@/components/ui/custom-components/form/form.svelte';
	import { Spinner } from '@/components/ui/spinner/index.js';

	// HOOKS
	import { useFormChanges } from '@/hooks/useFormChanges.svelte.js';

	// SCHEMAS
	import { updateCategorySchema } from '@/shared/features/categories/schemas/categoriesSchemas.js';

	// TYPES
	import type { FieldConfig } from '@/components/ui/custom-components/form/formTypes.js';
	import type { PreviewFile } from '@/features/uploadFile/types/uploadFileTypes.js';
	import type { Doc } from '@convex/_generated/dataModel';

	type Category = Doc<'categories'> & { image?: string };

	let { category }: { category: Category } = $props();

	const initialCategory = untrack(() => category);

	let submitting = $state(false);
	let uploadFiles = $state<PreviewFile[]>(
		initialCategory.imageKey
			? [
					{
						id: initialCategory.imageKey,
						key: initialCategory.imageKey,
						url: initialCategory.image ?? ''
					}
				]
			: []
	);

	const formChanges = useFormChanges(() => ({
		id: initialCategory._id,
		name: initialCategory.name,
		status: initialCategory.status
	}));

	const categoryFields = $derived([
		{
			kind: 'section',
			title: m['AdminEditCategoryPage.AdminEditCategoryForm.detailsTitle'](),
			description: m['AdminEditCategoryPage.AdminEditCategoryForm.detailsDescription'](),
			fields: [
				{
					kind: 'input',
					name: 'name',
					label: m['AdminEditCategoryPage.AdminEditCategoryForm.name'](),
					placeholder: m['AdminEditCategoryPage.AdminEditCategoryForm.namePlaceholder'](),
					type: 'text',
					maxLength: 100,
					required: true
				},
				{
					kind: 'upload',
					name: 'image',
					label: m['AdminEditCategoryPage.AdminEditCategoryForm.image'](),
					description: m['AdminEditCategoryPage.AdminEditCategoryForm.imageDescription'](),
					mode: 'single'
				}
			]
		},
		{
			kind: 'section',
			fields: [
				{
					kind: 'select',
					name: 'status',
					label: m['AdminEditCategoryPage.AdminEditCategoryForm.status'](),
					description: m['AdminEditCategoryPage.AdminEditCategoryForm.statusDescription'](),
					options: [
						{
							value: 'active',
							label: m['AdminEditCategoryPage.AdminEditCategoryForm.statusActive']()
						},
						{
							value: 'archived',
							label: m['AdminEditCategoryPage.AdminEditCategoryForm.statusArchived']()
						}
					]
				}
			]
		}
	] satisfies FieldConfig[]);
</script>

<Form
	function={api.tables.categories.mutations.updateCategory.updateCategory}
	fields={categoryFields}
	schema={updateCategorySchema}
	uploadNamespace="categories"
	bind:values={formChanges.values}
	bind:uploadFiles
	bind:submitting
	resetOnSuccess={false}
	prepareArgs={({ values }) => ({
		id: initialCategory._id,
		name: String(values.name ?? ''),
		status: values.status === 'archived' ? ('archived' as const) : ('active' as const)
	})}
	onSuccess={() => goto(ADMIN_PAGE_ENDPOINTS.CATEGORIES)}
	successMessage={m['AdminEditCategoryPage.AdminEditCategoryForm.categoryUpdated']()}
	errorMessage={m['AdminEditCategoryPage.AdminEditCategoryForm.updateError']()}
>
	<div class="flex flex-wrap justify-end gap-2">
		<Button href={ADMIN_PAGE_ENDPOINTS.CATEGORIES} variant="outline">
			{m['AdminEditCategoryPage.AdminEditCategoryForm.cancel']()}
		</Button>
		<Button type="submit" disabled={submitting}>
			{#if submitting}<Spinner />{/if}
			{m['AdminEditCategoryPage.AdminEditCategoryForm.saveChanges']()}
		</Button>
	</div>
</Form>
