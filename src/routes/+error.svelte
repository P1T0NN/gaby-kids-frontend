<script lang="ts">
	// SVELTEKIT IMPORTS
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { m } from '@/lib/paraglide/messages';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints';

	// COMPONENTS
	import { Button } from '@/components/ui/button';
</script>

<div class="flex min-h-[60vh] w-full flex-col items-center justify-center gap-4 px-4 text-center">
	<p class="text-5xl font-bold text-muted-foreground">{page.status}</p>
	<h1 class="text-lg font-medium">{m['ErrorPage.somethingWentWrong']()}</h1>
	<div class="flex items-center gap-2">
		<Button onclick={invalidateAll}>{m['ErrorPage.tryAgain']()}</Button>
		<Button variant="outline" onclick={() => goto(UNPROTECTED_PAGE_ENDPOINTS.ROOT)}>
			{m['ErrorPage.goHome']()}
		</Button>
	</div>
</div>
