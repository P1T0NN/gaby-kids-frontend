<script lang="ts">
	// COMPONENTS
	import { Skeleton } from '@/components/ui/skeleton/index.js';
</script>

<div class="flex flex-col gap-6 py-4" aria-hidden="true">
	<div class="flex items-center gap-3">
		<Skeleton class="size-12 shrink-0 rounded-lg" /><Skeleton class="h-5 w-1/2" />
	</div>
	<div class="flex items-center gap-3">
		<Skeleton class="size-12 shrink-0 rounded-lg" /><Skeleton class="h-5 w-2/3" />
	</div>
	<div class="flex items-center gap-3">
		<Skeleton class="size-12 shrink-0 rounded-lg" /><Skeleton class="h-5 w-1/3" />
	</div>
</div>
