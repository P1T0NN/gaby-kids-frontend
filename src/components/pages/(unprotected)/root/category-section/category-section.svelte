<script lang="ts">
	// LIBRARIES
	import { api } from '@convex/_generated/api';

	// COMPONENTS
	import CategorySectionItem from '@/components/pages/(unprotected)/root/category-section/category-section-item.svelte';
	import Section from '@/components/ui/custom-components/section/section.svelte';
	import { m } from '@/lib/paraglide/messages';

	// HOOKS
	import { useCachedConvexQuery } from '@/hooks/useCachedConvexQuery.svelte.js';

	const categories = useCachedConvexQuery(
		api.tables.categories.queries.fetchCategories.fetchCategories,
		() => ({})
	);
</script>

<Section
	class="overflow-hidden pt-16 pb-15"
	size="none"
	width="full"
	containerClass="flex max-w-7xl flex-col gap-7 px-6 sm:px-12"
>
	<p class="text-xs font-medium tracking-widest text-muted-foreground uppercase">
		{m['HomePage.CategorySection.eyebrow']()}
	</p>
	{#if categories.data}
		<div class="marquee flex w-max gap-6">
			{#each [...categories.data, ...categories.data] as category, index (index)}
				<CategorySectionItem {category} />
			{/each}
		</div>
	{/if}
</Section>

<style>
	.marquee {
		animation: marquee-x 46s linear infinite;
	}

	@keyframes marquee-x {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(-50%);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.marquee {
			animation: none;
		}
	}
</style>
