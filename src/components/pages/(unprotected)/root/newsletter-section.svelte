<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { Input } from '@/components/ui/input/index.js';
	import Section from '@/components/ui/custom-components/section/section.svelte';

	function handleSubscribe(event: SubmitEvent) {
		event.preventDefault();
	}
</script>

<Section
	class="bg-secondary py-19"
	size="none"
	width="full"
	containerClass="flex max-w-7xl items-end justify-between gap-12 px-6 sm:px-12"
>
	<div class="flex max-w-lg flex-col gap-2.5">
		<h2 class="font-serif text-4xl text-foreground">Recibe primero los nuevos modelos</h2>
		<p class="text-sm leading-relaxed text-muted-foreground">
			Un correo al mes con los ropones y guayaberas recién salidos del taller.
		</p>
	</div>
	<form class="flex items-stretch gap-3" onsubmit={handleSubscribe}>
		<Input
			type="email"
			name="email"
			placeholder="tu@correo.com"
			aria-label="Correo electrónico"
			class="h-auto w-80 rounded-sm border-border bg-background p-4 text-sm"
		/>
		<Button type="submit" class="h-auto rounded-sm px-8 py-4">Suscribirme</Button>
	</form>
</Section>
