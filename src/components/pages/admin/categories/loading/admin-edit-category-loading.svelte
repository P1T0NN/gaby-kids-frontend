<script lang="ts">
	// COMPONENTS
	import { Card } from '@/components/ui/card/index.js';
	import { Skeleton } from '@/components/ui/skeleton/index.js';
</script>

<header class="flex flex-col gap-2">
	<Skeleton class="h-3 w-16" />
	<Skeleton class="h-8 w-48" />
	<Skeleton class="h-4 w-full max-w-lg" />
</header>

<Card class="gap-6 p-6">
	<div class="flex flex-col gap-2">
		<Skeleton class="h-4 w-20" />
		<Skeleton class="h-10 w-full" />
	</div>
	<div class="flex flex-col gap-2">
		<Skeleton class="h-4 w-20" />
		<Skeleton class="h-10 w-full" />
	</div>
	<div class="flex justify-end gap-2">
		<Skeleton class="h-10 w-20" />
		<Skeleton class="h-10 w-28" />
	</div>
</Card>
