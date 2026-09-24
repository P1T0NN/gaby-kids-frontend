<script lang="ts">
	// COMPONENTS
	import Section from '@/components/ui/custom-components/section/section.svelte';

	const confianza = [
		{
			label: 'Envío a todo México',
			paths: [
				'M6 30h28v10H6z',
				'M34 33h6l4 5v2h-10',
				'M12 40a3 3 0 1 0 6 0',
				'M32 40a3 3 0 1 0 6 0'
			]
		},
		{
			label: 'Guía de tallas por edad',
			paths: ['M8 20h32v8H8z', 'M14 20v4', 'M20 20v6', 'M26 20v4', 'M32 20v6']
		},
		{ label: 'Cambios en 15 días', paths: ['M40 24a16 16 0 1 1-5-11', 'M40 8v8h-8'] },
		{ label: 'Mayoreo para tiendas', paths: ['M8 18h32v22H8z', 'M8 18l4-8h24l4 8', 'M18 26h12'] }
	];
</script>

<Section
	class="border-b border-border py-14"
	size="none"
	width="full"
	containerClass="grid max-w-7xl grid-cols-1 gap-6 px-6 sm:grid-cols-2 sm:px-12 lg:grid-cols-4"
>
	{#each confianza as item (item.label)}
		<div class="flex items-center gap-3.5">
			<svg
				class="size-8 flex-none text-accent"
				viewBox="0 0 48 48"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				{#each item.paths as path (path)}
					<path d={path}></path>
				{/each}
			</svg>
			<p class="text-sm text-foreground">{item.label}</p>
		</div>
	{/each}
</Section>
