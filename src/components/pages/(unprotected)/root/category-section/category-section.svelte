<script lang="ts">
	// LIBRARIES
	import { api } from '@convex/_generated/api';
	import AutoScroll from 'embla-carousel-auto-scroll';

	// COMPONENTS
	import CategorySectionItem from '@/components/pages/(unprotected)/root/category-section/category-section-item.svelte';
	import * as Carousel from '@/components/ui/carousel/index.js';
	import Section from '@/components/ui/custom-components/section/section.svelte';
	import { m } from '@/lib/paraglide/messages';

	// HOOKS
	import { useCachedConvexQuery } from '@/hooks/useCachedConvexQuery.svelte.js';

	const categories = useCachedConvexQuery(
		api.tables.categories.queries.fetchCategories.fetchCategories,
		() => ({})
	);

	const autoScroll = AutoScroll({
		speed: 0.7,
		stopOnMouseEnter: true,
		breakpoints: { '(prefers-reduced-motion: reduce)': { active: false } }
	});
</script>

<Section
	class="overflow-hidden pt-16 pb-15"
	size="none"
	width="full"
	containerClass="flex max-w-7xl flex-col gap-7 px-6 sm:px-12"
>
	{#if categories.data}
		<Carousel.Root
			opts={{
				align: 'start',
				loop: true,
				dragFree: true,
				breakpoints: { '(prefers-reduced-motion: reduce)': { duration: 0 } }
			}}
			plugins={[autoScroll]}
			class="flex min-w-0 flex-col gap-7"
			aria-label={m['HomePage.CategorySection.eyebrow']()}
			onfocusin={() => autoScroll.stop()}
			onpointerdown={() => autoScroll.stop()}
		>
			<div class="flex items-center justify-between gap-4">
				<p class="text-xs font-medium tracking-widest text-muted-foreground uppercase">
					{m['HomePage.CategorySection.eyebrow']()}
				</p>
				<div class="flex shrink-0 gap-2">
					<Carousel.Previous
						class="static size-11"
						aria-label={m['HomePage.CategorySection.previousCategory']()}
					/>
					<Carousel.Next
						class="static size-11"
						aria-label={m['HomePage.CategorySection.nextCategory']()}
					/>
				</div>
			</div>
			<Carousel.Content class="-ms-6 cursor-grab touch-pan-y active:cursor-grabbing">
				{#each categories.data as category (category._id)}
					<Carousel.Item class="basis-auto py-1 ps-6">
						<CategorySectionItem {category} />
					</Carousel.Item>
				{/each}
			</Carousel.Content>
		</Carousel.Root>
	{/if}
</Section>
