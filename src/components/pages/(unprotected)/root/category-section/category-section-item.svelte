<script lang="ts">
	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// COMPONENTS
	import Link from '@/components/ui/custom-components/link/link.svelte';

	// TYPES
	import type { Doc } from '@convex/_generated/dataModel';

	type Category = Doc<'categories'>;

	let { category }: { category: Category } = $props();
</script>

<Link
	href={`${UNPROTECTED_PAGE_ENDPOINTS.SHOP}?category=${category.slug}`}
	class="flex w-54 flex-none flex-col items-center gap-4"
>
	<div class="size-50 overflow-hidden rounded-full border border-accent bg-background">
		{#if category.image}
			<img
				src={category.image}
				alt=""
				loading="lazy"
				decoding="async"
				class="size-full scale-110 object-cover"
			/>
		{:else}
			<div class="grid size-full place-content-center text-muted-foreground">
				<span class="icon-[lucide--image] size-6" aria-hidden="true"></span>
			</div>
		{/if}
	</div>
	<p class="text-center text-xs font-medium tracking-widest text-foreground uppercase">
		{category.name}
	</p>
</Link>
