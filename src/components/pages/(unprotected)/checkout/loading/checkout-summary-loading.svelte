<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	// COMPONENTS
	import { Skeleton } from '@/components/ui/skeleton/index.js';
</script>

<div role="status" class="flex flex-col gap-5">
	<span class="sr-only">{m['CheckoutPage.loading']()}</span>
	<div class="flex gap-4" aria-hidden="true">
		<Skeleton class="size-16 rounded-lg" />
		<div class="flex flex-1 flex-col gap-3">
			<Skeleton class="h-4 w-3/4" /><Skeleton class="h-4 w-1/3" />
		</div>
	</div>
	<Skeleton class="h-16 w-full" />
</div>
