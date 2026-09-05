<script lang="ts">
	// COMPONENTS
	import * as Card from '@/components/ui/card';
	import { Skeleton } from '@/components/ui/skeleton';
</script>

<Card.Root>
	<Card.Content class="flex flex-col gap-4 p-6">
		<Skeleton class="h-5 w-24" />
		<Skeleton class="h-4 w-64 max-w-full" />
		<Skeleton class="h-9 w-52" />
	</Card.Content>
</Card.Root>
