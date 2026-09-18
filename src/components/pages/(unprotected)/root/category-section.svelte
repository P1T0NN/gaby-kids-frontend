<script lang="ts">
	// COMPONENTS
	import Section from '@/components/ui/custom-components/section/section.svelte';
	import StaticImage from '@/components/ui/custom-components/static-image/static-image.svelte';

	const categorias = [
		{ label: 'Guayaberas', img: '/testAssets/cat-guayaberas.png' },
		{ label: 'Trajes', img: '/testAssets/cat-trajes.png' },
		{ label: 'Trajes Típicos', img: '/testAssets/cat-tipicos.png' },
		{ label: 'Bautizos', img: '/testAssets/cat-formal.png' },
		{ label: 'Primera Comunión', img: '/testAssets/cat-comunion.png' },
		{ label: 'Accesorios', img: '/testAssets/cat-bautizos.png' },
		{ label: 'Formal', img: '/testAssets/cat-accesorios.png' }
	];
</script>

<Section
	class="overflow-hidden pt-16 pb-15"
	size="none"
	width="full"
	containerClass="flex max-w-7xl flex-col gap-7 px-6 sm:px-12"
>
	<p class="text-xs font-medium tracking-widest text-muted-foreground uppercase">
		Compra por categoría
	</p>
	<div class="marquee flex w-max gap-6">
		{#each [...categorias, ...categorias] as categoria, index (index)}
			<div class="flex w-54 flex-none flex-col items-center gap-4">
				<div class="size-50 overflow-hidden rounded-full border border-accent bg-background">
					<StaticImage
						src={categoria.img}
						alt={categoria.label}
						class="size-full scale-110 object-cover"
					/>
				</div>
				<p class="text-center text-xs font-medium tracking-widest text-foreground uppercase">
					{categoria.label}
				</p>
			</div>
		{/each}
	</div>
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
