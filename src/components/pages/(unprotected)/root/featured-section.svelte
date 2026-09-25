<script lang="ts">
	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// COMPONENTS
	import ButtonLink from '@/components/ui/custom-components/button-link/button-link.svelte';
	import Section from '@/components/ui/custom-components/section/section.svelte';
	import StaticImage from '@/components/ui/custom-components/static-image/static-image.svelte';
	import { m } from '@/lib/paraglide/messages';
</script>

<Section
	class="bg-foreground text-background"
	size="none"
	width="full"
	containerClass="grid min-h-[700px] grid-cols-1 px-0 sm:px-0 md:grid-cols-2"
>
	<div class="relative h-88 overflow-hidden md:h-auto">
		<StaticImage
			src="/root/opt/featured-guayaberas-1280w.webp"
			alt=""
			class="absolute inset-0 size-full object-contain opacity-90"
		/>
	</div>
	<div class="flex flex-col justify-center gap-6 px-6 py-10 sm:px-12 lg:px-18">
		<StaticImage
			src="/logo/opt/logo-guayabera-transparent-500w.webp"
			alt=""
			class="h-32 w-auto self-start"
		/>
		<h2 class="font-serif text-4xl">{m['HomePage.FeaturedSection.heading']()}</h2>
		<p class="max-w-md text-base leading-relaxed text-background/75">
			{m['HomePage.FeaturedSection.description']()}
		</p>
		<ButtonLink
			href={`${UNPROTECTED_PAGE_ENDPOINTS.SHOP}?category=guayaberas`}
			variant="outline"
			class="mt-2.5 h-auto self-start rounded-sm border-background bg-transparent px-8 py-4 hover:bg-background/10"
		>
			{m['HomePage.FeaturedSection.cta']()}
		</ButtonLink>
	</div>
</Section>
