<script lang="ts">
	// COMPONENTS
	import { m } from '@/lib/paraglide/messages';

	let { productName }: { productName: string } = $props();
</script>

<header class="flex flex-col gap-1">
	<p class="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
		{m['AdminEditProductPage.adminLabel']()}
	</p>
	<h1 class="text-2xl font-semibold tracking-tight">{m['AdminEditProductPage.heading']()}</h1>
	<p class="text-sm text-muted-foreground">
		{m['AdminEditProductPage.description']({ name: productName })}
	</p>
</header>
