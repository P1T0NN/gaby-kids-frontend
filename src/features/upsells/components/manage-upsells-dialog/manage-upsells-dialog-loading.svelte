<script lang="ts">
	// COMPONENTS
	import { Skeleton } from '@/components/ui/skeleton/index.js';
</script>

<div class="flex flex-col gap-5 p-6" aria-busy="true">
	<Skeleton class="h-6 w-40" />
	<Skeleton class="h-16 w-full rounded-lg" />
	<Skeleton class="h-24 w-full rounded-lg" />
</div>
