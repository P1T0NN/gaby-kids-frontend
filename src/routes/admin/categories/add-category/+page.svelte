<script lang="ts">
	// SVELTEKIT IMPORTS
	import { gotoParaglide } from '@/utils/gotoParaglide.js';

	// CONVEX
	import { api } from '@convex/_generated/api';

	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// COMPONENTS
	import AdminCategoryFormHeader from '@/components/pages/admin/categories/admin-category-form-header.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import ButtonLink from '@/components/ui/custom-components/button-link/button-link.svelte';
	import Form from '@/components/ui/custom-components/form/form.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import { Spinner } from '@/components/ui/spinner/index.js';

	// SCHEMAS
	import { createCategorySchema } from '@/shared/features/categories/schemas/categoriesSchemas.js';

	// TYPES
	import type { FieldConfig } from '@/components/ui/custom-components/form/formTypes.js';

	const categoryFields = $derived([
		{
			kind: 'section',
			title: m['AddCategoryPage.detailsTitle'](),
			description: m['AddCategoryPage.detailsDescription'](),
			fields: [
				{
					kind: 'input',
					name: 'name',
					label: m['AddCategoryPage.name'](),
					placeholder: m['AddCategoryPage.namePlaceholder'](),
					type: 'text',
					maxLength: 100,
					required: true
				},
				{
					kind: 'upload',
					name: 'image',
					label: m['AddCategoryPage.image'](),
					description: m['AddCategoryPage.imageDescription'](),
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
					label: m['AddCategoryPage.status'](),
					description: m['AddCategoryPage.statusDescription'](),
					options: [
						{ value: 'active', label: m['AddCategoryPage.statusActive']() },
						{ value: 'archived', label: m['AddCategoryPage.statusArchived']() }
					]
				}
			]
		}
	] satisfies FieldConfig[]);

	let submitting = $state(false);
</script>

<SvelteHead title={m['AddCategoryPage.pageTitle']()} noindex />

<div class="mx-auto flex w-full max-w-3xl flex-col gap-6">
	<AdminCategoryFormHeader
		adminLabel={m['AddCategoryPage.AdminCategoryFormHeader.adminLabel']()}
		heading={m['AddCategoryPage.title']()}
		description={m['AddCategoryPage.pageDescription']()}
	/>

	<Form
		function={api.tables.categories.mutations.createCategory.createCategory}
		fields={categoryFields}
		schema={createCategorySchema}
		uploadNamespace="categories"
		values={{ status: 'active' }}
		bind:submitting
		onSuccess={() => gotoParaglide(ADMIN_PAGE_ENDPOINTS.CATEGORIES)}
		successMessage={m['AddCategoryPage.categoryAdded']()}
		errorMessage={m['AddCategoryPage.addError']()}
	>
		<div class="flex flex-wrap justify-end gap-2">
			<ButtonLink href={ADMIN_PAGE_ENDPOINTS.CATEGORIES} variant="outline">
				{m['AddCategoryPage.cancel']()}
			</ButtonLink>
			<Button type="submit" disabled={submitting}>
				{#if submitting}<Spinner />{/if}
				{m['AddCategoryPage.addCategory']()}
			</Button>
		</div>
	</Form>
</div>
