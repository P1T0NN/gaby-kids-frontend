<script lang="ts">
	import { m } from '@/lib/paraglide/messages';
</script>

<header class="flex flex-col gap-1">
	<p class="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
		{m['AddProductPage.adminLabel']()}
	</p>
	<h1 class="text-2xl font-semibold tracking-tight">{m['AddProductPage.title']()}</h1>
	<p class="text-sm text-muted-foreground">{m['AddProductPage.pageDescription']()}</p>
</header>
