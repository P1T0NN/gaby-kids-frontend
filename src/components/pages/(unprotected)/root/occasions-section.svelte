<script lang="ts">
	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// COMPONENTS
	import * as Card from '@/components/ui/card/index.js';
	import Link from '@/components/ui/custom-components/link/link.svelte';
	import Section from '@/components/ui/custom-components/section/section.svelte';
	import StaticImage from '@/components/ui/custom-components/static-image/static-image.svelte';
	import { m } from '@/lib/paraglide/messages';

	const ocasiones = [
		{
			img: '/root/opt/occasions-bautizo-960w.webp',
			category: 'bautizo',
			title: () => m['HomePage.OccasionsSection.bautizoTitle'](),
			description: () => m['HomePage.OccasionsSection.bautizoDescription']()
		},
		{
			img: '/root/opt/occasions-presentacion-960w.webp',
			category: null,
			title: () => m['HomePage.OccasionsSection.presentacionTitle'](),
			description: () => m['HomePage.OccasionsSection.presentacionDescription']()
		},
		{
			img: '/root/opt/occasions-comunion-960w.webp',
			category: 'primera-comunion',
			title: () => m['HomePage.OccasionsSection.comunionTitle'](),
			description: () => m['HomePage.OccasionsSection.comunionDescription']()
		}
	];

	function getOccasionHref(category: string | null): string {
		return category
			? `${UNPROTECTED_PAGE_ENDPOINTS.SHOP}?category=${category}`
			: UNPROTECTED_PAGE_ENDPOINTS.SHOP;
	}
</script>

<Section
	class="bg-secondary py-20"
	size="none"
	width="full"
	containerClass="flex max-w-7xl flex-col gap-9 px-6 sm:px-12"
>
	<div class="flex flex-col gap-2.5">
		<p class="text-xs font-medium tracking-widest text-muted-foreground uppercase">
			{m['HomePage.OccasionsSection.eyebrow']()}
		</p>
		<h2 class="font-serif text-5xl text-foreground">
			{m['HomePage.OccasionsSection.heading']()}
		</h2>
	</div>
	<div class="grid grid-cols-3 gap-6">
		{#each ocasiones as ocasion (ocasion.img)}
			<Link
				href={getOccasionHref(ocasion.category)}
				class="block h-full rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
			>
				<Card.Root class="h-full gap-0 rounded-sm border border-border py-0 shadow-none ring-0">
					<div class="h-65 overflow-hidden border-b border-border bg-secondary">
						<StaticImage src={ocasion.img} alt={ocasion.title()} class="size-full object-cover" />
					</div>
					<Card.Content class="flex flex-1 flex-col gap-2.5 px-7 pt-6 pb-8">
						<h3 class="font-serif text-3xl text-foreground">{ocasion.title()}</h3>
						<p class="text-sm leading-relaxed text-muted-foreground">{ocasion.description()}</p>
						<span class="mt-auto pt-2 text-sm font-medium text-accent">
							{m['HomePage.OccasionsSection.cta']()}
						</span>
					</Card.Content>
				</Card.Root>
			</Link>
		{/each}
	</div>
</Section>
