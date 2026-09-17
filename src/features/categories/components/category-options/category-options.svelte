<script lang="ts">
	// LIBRARIES
	import { api } from '@convex/_generated/api';
	import { useQuery } from 'convex-svelte';
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import NativeSelect from '@/components/ui/native-components/native-select/native-select.svelte';

	// TYPES
	import type { FilterOption } from '@/shared/features/filters/types/filterTypes.js';

	let {
		id,
		label = m['CategoriesFeature.CategoryOptions.category'](),
		categoryValue = '',
		onCategoryChange = () => {},
		class: className
	}: {
		id?: string;
		label?: string;
		categoryValue?: string;
		onCategoryChange?: (value: string) => void;
		class?: string;
	} = $props();

	const categoryOptionsQuery = useQuery(
		api.tables.categories.queries.fetchCategoryOptions.fetchCategoryOptions,
		{}
	);

	const categoryOptions = $derived<FilterOption[]>([
		{
			value: '',
			label: m['CategoriesFeature.CategoryOptions.allCategories']()
		},
		...(categoryOptionsQuery.data ?? []).map((category) => ({
			value: category.slug,
			label: category.name
		}))
	]);
</script>

<NativeSelect
	{id}
	{label}
	options={categoryOptions}
	value={categoryValue}
	placeholder={m['CategoriesFeature.CategoryOptions.category']()}
	onchange={onCategoryChange}
	class={className}
/>
