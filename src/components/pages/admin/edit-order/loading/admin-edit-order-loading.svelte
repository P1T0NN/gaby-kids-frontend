<script lang="ts">
	// COMPONENTS
	import * as Card from '@/components/ui/card/index.js';
	import { Skeleton } from '@/components/ui/skeleton/index.js';
</script>

<div class="flex flex-col gap-2">
	<Skeleton class="h-3 w-14" />
	<Skeleton class="h-8 w-52" />
	<Skeleton class="h-4 w-72 max-w-full" />
</div>
<div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
	<div class="flex flex-col gap-6">
		{#each [1, 2] as section (section)}
			<Card.Root
				><Card.Content class="flex flex-col gap-4 p-6"
					><Skeleton class="h-5 w-32" /><Skeleton class="h-24 w-full" /></Card.Content
				></Card.Root
			>
		{/each}
	</div>
	<Card.Root
		><Card.Content class="flex flex-col gap-4 p-6"
			><Skeleton class="h-5 w-40" /><Skeleton class="h-9 w-full" /><Skeleton
				class="h-24 w-full"
			/></Card.Content
		></Card.Root
	>
</div>
