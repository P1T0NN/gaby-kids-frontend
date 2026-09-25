<script lang="ts">
	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// COMPONENTS
	import ButtonLink from '@/components/ui/custom-components/button-link/button-link.svelte';
	import Section from '@/components/ui/custom-components/section/section.svelte';
	import StaticImage from '@/components/ui/custom-components/static-image/static-image.svelte';
</script>

<Section
	class="bg-foreground text-background"
	size="none"
	width="full"
	containerClass="grid min-h-[520px] grid-cols-1 px-0 sm:px-0 md:grid-cols-2"
>
	<div class="overflow-hidden">
		<StaticImage
			src="/root/featured-guayaberas.png"
			alt=""
			class="size-full object-cover opacity-90"
		/>
	</div>
	<div class="flex flex-col justify-center gap-6 px-6 py-20 sm:px-12 lg:px-18">
		<StaticImage
			src="/logo/logo-guayabera-transparent.png"
			alt=""
			class="h-12 w-auto self-start"
		/>
		<h2 class="font-serif text-4xl">Lino natural, bordado a mano</h2>
		<p class="max-w-md text-base leading-relaxed text-background/75">
			Guayaberas de niño hechas en lino fresco, con alforzas cosidas una por una y bordado del
			nombre sin costo. Su propia etiqueta, la misma casa.
		</p>
		<ButtonLink
			href={`${UNPROTECTED_PAGE_ENDPOINTS.SHOP}?category=guayaberas`}
			variant="outline"
			class="mt-2.5 h-auto self-start rounded-sm border-background bg-transparent px-8 py-4 hover:bg-background/10"
		>
			Conocer gabybera
		</ButtonLink>
	</div>
</Section>
