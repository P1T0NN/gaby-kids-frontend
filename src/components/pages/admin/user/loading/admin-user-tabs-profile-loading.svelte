<script lang="ts">
	// COMPONENTS
	import * as Card from '@/components/ui/card';
	import { Skeleton } from '@/components/ui/skeleton';
</script>

<div class="flex flex-col gap-8">
	<Card.Root>
		<Card.Header class="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
			<div class="flex min-w-0 gap-4">
				<Skeleton class="size-12 shrink-0 rounded-full" />
				<div class="flex min-w-0 flex-col gap-2.5">
					<Skeleton class="h-6 w-40 max-w-full" />
					<div class="flex flex-wrap items-center gap-2">
						<Skeleton class="h-4 w-44 max-w-full" />
						<Skeleton class="h-5 w-20" />
					</div>
				</div>
			</div>

			<div class="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
				<Skeleton class="h-5 w-16" />
				<Skeleton class="h-5 w-16" />
			</div>
		</Card.Header>

		<Card.Content class="border-t border-border pt-4">
			<div class="flex flex-wrap items-center gap-x-4 gap-y-2">
				<Skeleton class="h-4 w-48 max-w-full" />
				<Skeleton class="h-4 w-48 max-w-full" />
			</div>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Skeleton class="h-4 w-20" />
		</Card.Header>

		<Card.Content class="pt-0">
			<div class="relative flex items-start justify-between">
				<div class="absolute top-1.5 right-2 left-2 h-px bg-border" aria-hidden="true"></div>

				<div class="relative flex flex-col gap-1.5">
					<Skeleton class="size-3 rounded-full" />
					<Skeleton class="h-3 w-16" />
					<Skeleton class="h-4 w-24" />
				</div>

				<div class="relative flex flex-col items-end gap-1.5">
					<Skeleton class="size-3 rounded-full" />
					<Skeleton class="h-3 w-24" />
					<Skeleton class="h-4 w-32" />
					<Skeleton class="h-3 w-14" />
				</div>
			</div>
		</Card.Content>
	</Card.Root>
</div>
