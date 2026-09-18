<script lang="ts">
	// COMPONENTS
	import * as Card from '@/components/ui/card/index.js';
	import Link from '@/components/ui/custom-components/link/link.svelte';
	import Section from '@/components/ui/custom-components/section/section.svelte';
	import StaticImage from '@/components/ui/custom-components/static-image/static-image.svelte';

	const ocasiones = [
		{
			titulo: 'Bautizo',
			img: '/root/occasions-bautizo.png',
			desc: 'Ropones, batitas, faldón y set de veladora.',
			foto: 'Foto — bebé en brazos, ropón largo'
		},
		{
			titulo: 'Presentación de 3 años',
			img: '/root/occasions-presentacion.png',
			desc: 'Vestidos de encaje y trajes con detalle bordado.',
			foto: 'Foto — niña 3 años, vestido marfil'
		},
		{
			titulo: 'Primera Comunión',
			img: '/root/occasions-comunion.png',
			desc: 'Vestidos largos, guayaberas y accesorios de altar.',
			foto: 'Foto — niño y niña, comunión'
		}
	];
</script>

<Section
	class="bg-secondary py-20"
	size="none"
	width="full"
	containerClass="flex max-w-7xl flex-col gap-9 px-6 sm:px-12"
>
	<div class="flex flex-col gap-2.5">
		<p class="text-xs font-medium tracking-widest text-muted-foreground uppercase">
			Compra por ocasión
		</p>
		<h2 class="font-serif text-5xl text-foreground">
			El evento tiene fecha. Nosotros la cumplimos.
		</h2>
	</div>
	<div class="grid grid-cols-3 gap-6">
		{#each ocasiones as ocasion (ocasion.titulo)}
			<Card.Root class="gap-0 rounded-sm border border-border py-0 shadow-none ring-0">
				<div class="h-65 overflow-hidden border-b border-border bg-secondary">
					<StaticImage src={ocasion.img} alt={ocasion.titulo} class="size-full object-cover" />
				</div>
				<Card.Content class="flex flex-col gap-2.5 px-7 pt-6 pb-8">
					<h3 class="font-serif text-3xl text-foreground">{ocasion.titulo}</h3>
					<p class="text-sm leading-relaxed text-muted-foreground">{ocasion.desc}</p>
					<Link href="/shop" class="pt-2 text-sm font-medium text-accent">Ver todo →</Link>
				</Card.Content>
			</Card.Root>
		{/each}
	</div>
</Section>
