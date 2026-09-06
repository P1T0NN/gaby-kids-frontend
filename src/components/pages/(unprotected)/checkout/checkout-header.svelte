<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	// COMPONENTS
	import ButtonLink from '@/components/ui/custom-components/button-link/button-link.svelte';
</script>

<header class="flex flex-col items-start gap-5">
	<ButtonLink href="/shop" variant="link" class="h-11 px-0 text-muted-foreground">
		<span class="icon-[lucide--arrow-left] size-4" aria-hidden="true"></span>
		{m['CheckoutPage.back']()}
	</ButtonLink>
	<div class="flex flex-col gap-2">
		<h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">{m['CheckoutPage.title']()}</h1>
		<p class="text-muted-foreground">{m['CheckoutPage.description']()}</p>
	</div>
</header>
