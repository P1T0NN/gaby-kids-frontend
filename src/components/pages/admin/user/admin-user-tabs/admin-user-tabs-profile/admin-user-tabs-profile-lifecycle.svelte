<script lang="ts">
	// COMPONENTS
	import * as Card from '@/components/ui/card';

	// UTILS
	import { formatDate, formatDateTime, formatRelativeTime } from '@/shared/utils/date';
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime';

	let { createdAt, updatedAt }: { createdAt: number; updatedAt: number } = $props();
</script>

<Card.Root aria-labelledby="timeline-heading">
	<Card.Header>
		<Card.Title
			id="timeline-heading"
			class="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase"
		>
			{m['AdminUserPage.AdminUserTabsProfileLifecycle.lifecycle']()}
		</Card.Title>
	</Card.Header>

	<Card.Content class="pt-0">
		<div class="relative flex items-start justify-between">
			<div class="absolute top-1.5 right-2 left-2 h-px bg-border" aria-hidden="true"></div>

			<div class="relative flex flex-col gap-1.5">
				<span class="size-3 rounded-full border-2 border-primary bg-background" aria-hidden="true"
				></span>
				<span class="text-xs font-medium tracking-wide text-muted-foreground uppercase"
					>{m['AdminUserPage.AdminUserTabsProfileLifecycle.created']()}</span
				>
				<time datetime={new Date(createdAt).toISOString()} class="text-sm font-medium">
					{formatDate(createdAt, getLocale())}
				</time>
			</div>

			<div class="relative flex flex-col items-end gap-1.5 text-right">
				<span
					class="size-3 self-end rounded-full border-2 border-muted-foreground bg-background"
					aria-hidden="true"
				></span>
				<span class="text-xs font-medium tracking-wide text-muted-foreground uppercase"
					>{m['AdminUserPage.AdminUserTabsProfileLifecycle.lastUpdated']()}</span
				>
				<time datetime={new Date(updatedAt).toISOString()} class="text-sm font-medium">
					{formatDateTime(updatedAt, getLocale())}
				</time>
				<span class="text-xs text-muted-foreground"
					>{formatRelativeTime(updatedAt, getLocale())}</span
				>
			</div>
		</div>
	</Card.Content>
</Card.Root>
