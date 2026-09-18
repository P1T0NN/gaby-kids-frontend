<script lang="ts">
	// COMPONENTS
	import { Badge } from '@/components/ui/badge/index.js';
	import Link from '@/components/ui/custom-components/link/link.svelte';
	import Section from '@/components/ui/custom-components/section/section.svelte';
	import StaticImage from '@/components/ui/custom-components/static-image/static-image.svelte';

	const destacados = [
		{
			nombre: 'Ropón Guadalupe — encaje chantilly',
			img: '/root/testproduct.JPG',
			foto: 'Foto — niña, ropón encaje, cuerpo completo',
			tallas: '0-3m · 3-6m · 6-12m',
			precio: '$1,290 MXN',
			badge: 'Nuevo',
			badgeClass: 'bg-accent'
		},
		{
			nombre: 'Batita Lucía — organza y satín',
			img: '/testAssets/cat-formal.png',
			foto: 'Foto — bebé, batita organza, cuerpo completo',
			tallas: '0-3m · 3-6m',
			precio: '$980 MXN',
			badge: null,
			badgeClass: null
		},
		{
			nombre: 'Guayabera Yucatán niño',
			img: '/testAssets/cat-guayaberas.png',
			foto: 'Foto — niño, guayabera lino, cuerpo completo',
			tallas: '2 años · 3 años · 4 años',
			precio: '$1,150 MXN',
			badge: null,
			badgeClass: null
		},
		{
			nombre: 'Traje de Charro Jalisco',
			img: '/testAssets/cat-tipicos.png',
			foto: 'Foto — niño, traje charro, cuerpo completo',
			tallas: '3 años · 4 años',
			precio: '$2,450 MXN',
			badge: 'Últimas piezas',
			badgeClass: 'bg-primary'
		}
	];
</script>

<Section
	class="py-20"
	size="none"
	width="full"
	containerClass="flex max-w-7xl flex-col gap-8 px-6 sm:px-12"
>
	<div class="flex items-end justify-between">
		<h2 class="font-serif text-5xl text-foreground">Lo más pedido esta temporada</h2>
		<Link href="/shop" class="text-sm font-medium text-accent">Ver los 124 modelos →</Link>
	</div>
	<div class="grid grid-cols-4 gap-6">
		{#each destacados as producto (producto.nombre)}
			<article class="flex flex-col gap-3">
				<div class="relative aspect-3/4 rounded-sm border border-border bg-secondary">
					<StaticImage
						src={producto.img}
						alt={producto.nombre}
						class="absolute inset-0 size-full object-cover"
					/>
					{#if producto.badge}
						<Badge
							class="absolute top-3 left-3 h-auto rounded-xs px-2.5 py-1.5 tracking-widest text-primary-foreground uppercase {producto.badgeClass}"
						>
							{producto.badge}
						</Badge>
					{/if}
				</div>
				<h3 class="font-serif text-xl leading-tight text-foreground">{producto.nombre}</h3>
				<p class="text-xs font-medium tracking-widest text-muted-foreground uppercase">
					{producto.tallas}
				</p>
				<p class="text-sm font-medium text-foreground">{producto.precio}</p>
			</article>
		{/each}
	</div>
</Section>
