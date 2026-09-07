<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Skeleton } from '@/components/ui/skeleton/index.js';
</script>

<div role="status" class="flex flex-col gap-6">
	<span class="sr-only">{m['CheckoutSuccessPage.CheckoutSuccessLoading.loading']()}</span>
	<div class="flex flex-col items-center gap-4" aria-hidden="true">
		<Skeleton class="size-16 rounded-full" />
		<Skeleton class="h-7 w-64" />
		<Skeleton class="h-4 w-80 max-w-full" />
	</div>
	<Skeleton class="h-56 w-full rounded-2xl" />
	<Skeleton class="h-40 w-full rounded-2xl" />
</div>
