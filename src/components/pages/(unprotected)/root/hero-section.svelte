<script lang="ts">
	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// COMPONENTS
	import ButtonLink from '@/components/ui/custom-components/button-link/button-link.svelte';
	import Section from '@/components/ui/custom-components/section/section.svelte';
	import StaticImage from '@/components/ui/custom-components/static-image/static-image.svelte';
</script>

<Section
	class="relative flex h-190 items-center bg-secondary"
	size="none"
	width="full"
	containerClass="max-w-7xl px-6 sm:px-12"
>
	<StaticImage
		src="/root/opt/hero-image-2-1536w.webp"
		alt=""
		class="absolute inset-0 size-full object-cover"
	/>
	<div
		class="absolute inset-0 bg-linear-to-b from-background/35 via-background/62 to-background/45"
	></div>
	<div class="relative flex w-full flex-col items-center gap-6 text-center">
		<p class="text-xs font-medium tracking-widest text-muted-foreground uppercase">
			Hecho en México
		</p>
		<h1 class="max-w-4xl font-serif text-7xl tracking-tight text-pretty text-foreground">
			Para el día que se recuerda toda la vida
		</h1>
		<p class="max-w-xl text-lg leading-relaxed text-muted-foreground">
			Ropones, batitas y guayaberas para bautizos, presentaciones y primeras comuniones.
		</p>
		<div class="flex flex-wrap justify-center gap-3.5 pt-2">
			<ButtonLink href="/shop" class="h-auto rounded-sm px-8 py-4 leading-none tracking-wide">
				Ver colección
			</ButtonLink>
			<ButtonLink
				href={`${UNPROTECTED_PAGE_ENDPOINTS.SHOP}?category=guayaberas`}
				variant="outline"
				class="h-auto rounded-sm border-foreground bg-transparent px-8 py-4 leading-none tracking-wide hover:bg-background/20"
			>
				Guayaberas gabybera
			</ButtonLink>
		</div>
	</div>
	<p class="absolute right-6 bottom-5 font-serif text-xs text-foreground/45">Gaby Kids ®</p>
</Section>
