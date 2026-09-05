<script lang="ts">
	// CONVEX
	import { api } from '@convex/_generated/api';

	// COMPONENTS
	import AdminCategoryFormHeader from '@/components/pages/admin/categories/admin-category-form-header.svelte';
	import AdminEditCategoryForm from '@/components/pages/admin/categories/admin-edit-category-form.svelte';
	import AdminEditCategoryLoading from '@/components/pages/admin/categories/loading/admin-edit-category-loading.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import { m } from '@/lib/paraglide/messages';

	// HOOKS
	import { useCachedConvexQuery } from '@/hooks/useCachedConvexQuery.svelte.js';

	// TYPES
	import type { Id } from '@convex/_generated/dataModel';
	import type { PageProps } from './$types';

	let { params }: PageProps = $props();

	// SAFETY: The public route parameter is validated by Convex's v.id('categories') validator.
	const category = useCachedConvexQuery(
		api.tables.categories.queries.fetchCategory.fetchCategory,
		() => ({ id: params.id as Id<'categories'> })
	);
</script>

<SvelteHead title={m['AdminEditCategoryPage.pageTitle']()} noindex />

<div class="mx-auto flex w-full max-w-3xl flex-col gap-6">
	{#if category.isLoading}
		<AdminEditCategoryLoading />
	{:else if category.error || !category.data}
		<ErrorComponent message={m['AdminEditCategoryPage.loadError']()} card />
	{:else}
		<AdminCategoryFormHeader
			adminLabel={m['AdminEditCategoryPage.AdminCategoryFormHeader.adminLabel']()}
			heading={m['AdminEditCategoryPage.heading']()}
			description={m['AdminEditCategoryPage.description']({ name: category.data.name })}
		/>
		<AdminEditCategoryForm category={category.data} />
	{/if}
</div>
