<script lang="ts">
	// LIBRARIES
	import type { FunctionReturnType } from 'convex/server';

	// CONVEX
	import type { api } from '@convex/_generated/api';

	// COMPONENTS
	import { Badge } from '@/components/ui/badge/index.js';
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime';

	// UTILS
	import { formatDateTime } from '@/shared/utils/date';

	type Log = FunctionReturnType<
		typeof api.betterAuth.tables.users.queries.fetchUserLogsAdmin.fetchUserLogsAdmin
	>['items'][number];

	type Severity = 'info' | 'warning' | 'error' | 'critical';

	let { log }: { log: Log } = $props();

	function severityVariant(
		severity: Severity
	): 'default' | 'secondary' | 'destructive' | 'outline' {
		if (severity === 'critical' || severity === 'error') return 'destructive';
		if (severity === 'warning') return 'outline';
		if (severity === 'info') return 'secondary';
		return 'default';
	}
</script>

<article
	class="flex min-w-0 flex-col gap-4 rounded-4xl bg-card p-4 text-sm shadow-md ring-1 ring-foreground/5 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
>
	<div class="flex min-w-0 flex-1 flex-col gap-2">
		<div class="flex min-w-0 flex-wrap items-center gap-2">
			<Badge variant={severityVariant(log.severity)} class="capitalize">
				{log.severity}
			</Badge>
			<code class="truncate font-medium">{log.action}</code>
		</div>

		{#if log.resourceType || log.resourceId}
			<p
				class="truncate text-xs text-muted-foreground"
				title={log.resourceId
					? m['AdminUserPage.AdminUserTabsLogsItem.resourceWithId']({
							type: log.resourceType ?? m['AdminUserPage.AdminUserTabsLogsItem.resource'](),
							id: log.resourceId
						})
					: (log.resourceType ?? m['AdminUserPage.AdminUserTabsLogsItem.resource']())}
			>
				{log.resourceId
					? m['AdminUserPage.AdminUserTabsLogsItem.resourceWithId']({
							type: log.resourceType ?? m['AdminUserPage.AdminUserTabsLogsItem.resource'](),
							id: log.resourceId
						})
					: (log.resourceType ?? m['AdminUserPage.AdminUserTabsLogsItem.resource']())}
			</p>
		{/if}

		<div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
			<time datetime={new Date(log.timestamp).toISOString()}>
				{formatDateTime(log.timestamp, getLocale())}
			</time>
			{#if log.ipAddress}
				<span>{log.ipAddress}</span>
			{/if}
			{#if log.userAgent}
				<span class="max-w-full truncate" title={log.userAgent}>{log.userAgent}</span>
			{/if}
		</div>
	</div>

	{#if log.tags.length > 0}
		<div class="flex flex-wrap gap-1 sm:max-w-xs sm:justify-end">
			{#each log.tags as tag (tag)}
				<Badge variant="secondary">{tag}</Badge>
			{/each}
		</div>
	{/if}
</article>
