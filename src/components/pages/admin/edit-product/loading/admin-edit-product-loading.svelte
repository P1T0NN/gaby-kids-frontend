<script lang="ts">
	// COMPONENTS
	import * as Card from '@/components/ui/card/index.js';
	import { Skeleton } from '@/components/ui/skeleton/index.js';
</script>

<div class="flex flex-col gap-2">
	<Skeleton class="h-3 w-14" />
	<Skeleton class="h-8 w-40" />
	<Skeleton class="h-4 w-72 max-w-full" />
</div>

{#each [1, 2] as section (section)}
	<Card.Root>
		<Card.Header>
			<Skeleton class="h-5 w-32" />
			<Skeleton class="h-4 w-64 max-w-full" />
		</Card.Header>
		<Card.Content class="flex flex-col gap-5">
			<Skeleton class="h-9 w-full" />
			<Skeleton class="h-24 w-full" />
		</Card.Content>
	</Card.Root>
{/each}
