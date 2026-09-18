<script lang="ts">
	// COMPONENTS
	import ButtonLink from '@/components/ui/custom-components/button-link/button-link.svelte';
	import Section from '@/components/ui/custom-components/section/section.svelte';
	import StaticImage from '@/components/ui/custom-components/static-image/static-image.svelte';
</script>

<Section
	class="bg-foreground text-background"
	size="none"
	width="full"
	containerClass="grid min-h-[520px] grid-cols-2 px-0 sm:px-0"
>
	<div class="overflow-hidden">
		<StaticImage
			src="/root/featured-guayaberas.png"
			alt=""
			class="size-full object-cover opacity-90"
		/>
	</div>
	<div class="flex flex-col justify-center gap-6 px-18 py-20">
		<svg width="150" height="46" viewBox="0 0 150 46" aria-hidden="true">
			<path
				d="M18 10v22M11 17h14M18 32c-5 0-9-3.5-9-8"
				fill="none"
				stroke="currentColor"
				stroke-width="1.3"
			></path>
			<circle cx="18" cy="7" r="3" fill="none" stroke="currentColor" stroke-width="1.3"></circle>
			<text x="38" y="30" class="fill-current font-serif" font-size="26" letter-spacing="1">
				gabybera
			</text>
		</svg>
		<h2 class="font-serif text-4xl">Lino natural, bordado a mano</h2>
		<p class="max-w-md text-base leading-relaxed text-background/75">
			Guayaberas de niño hechas en lino fresco, con alforzas cosidas una por una y bordado del
			nombre sin costo. Su propia etiqueta, la misma casa.
		</p>
		<ButtonLink
			href="/shop"
			variant="outline"
			class="mt-2.5 h-auto self-start rounded-sm border-background bg-transparent px-8 py-4 hover:bg-background/10"
		>
			Conocer gabybera
		</ButtonLink>
	</div>
</Section>
