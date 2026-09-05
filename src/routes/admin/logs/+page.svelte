<script lang="ts">
	// SVELTEKIT IMPORTS
	import { resolve } from '$app/paths';

	// LIBRARIES
	import type { FunctionReturnType } from 'convex/server';
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime';

	// CONVEX
	import { api } from '@convex/_generated/api';

	// CONFIG
	import { PAGINATION_CONFIG } from '@/shared/features/pagination/config';

	// COMPONENTS
	import { Badge } from '@/components/ui/badge';
	import DataTable from '@/components/ui/custom-components/data-table/data-table.svelte';
	import EmptyData from '@/components/ui/custom-components/empty-data/empty-data.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import { TableCell, TableHead } from '@/components/ui/table';

	// HOOKS
	import { useConvexPagination } from '@/features/pagination/hooks/useConvexPagination.svelte.js';

	// UTILS
	import { formatDateTime } from '@/shared/utils/date';

	type Log = FunctionReturnType<
		typeof api.auditLogs.queries.fetchAuditLogsAdmin.fetchAuditLogsAdmin
	>['items'][number];
	type Severity = Log['severity'];

	const logs = useConvexPagination(
		api.auditLogs.queries.fetchAuditLogsAdmin.fetchAuditLogsAdmin,
		() => ({}),
		{ pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE }
	);

	function severityVariant(
		severity: Severity
	): 'default' | 'secondary' | 'destructive' | 'outline' {
		if (severity === 'critical' || severity === 'error') return 'destructive';
		if (severity === 'warning') return 'outline';
		return 'secondary';
	}
</script>

<SvelteHead title={m['AdminLogsPage.pageTitle']()} noindex />

<div class="flex min-h-full min-w-0 flex-1 flex-col gap-6">
	<DataTable pagination={logs} key={(log) => log.id} placement="above">
		{#snippet header()}
			<div class="flex flex-col gap-1">
				<p class="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
					{m['AdminLogsPage.adminLabel']()}
				</p>
				<h1 class="text-2xl font-semibold tracking-tight">{m['AdminLogsPage.auditLogs']()}</h1>
				<p class="text-sm text-muted-foreground">
					{m['AdminLogsPage.description']()}
				</p>
			</div>
		{/snippet}

		{#snippet head()}
			<TableHead class="min-w-56">{m['AdminLogsPage.eventColumn']()}</TableHead>
			<TableHead>{m['AdminLogsPage.severityColumn']()}</TableHead>
			<TableHead class="hidden md:table-cell">{m['AdminLogsPage.actorColumn']()}</TableHead>
			<TableHead class="hidden lg:table-cell">{m['AdminLogsPage.resourceColumn']()}</TableHead>
			<TableHead>{m['AdminLogsPage.timeColumn']()}</TableHead>
		{/snippet}

		{#snippet row(log)}
			<TableCell>
				<code class="font-medium">{log.action}</code>
				<div class="mt-1 flex max-w-64 flex-col gap-0.5 text-xs text-muted-foreground md:hidden">
					<span class="truncate">
						{m['AdminLogsPage.actor']({ actor: log.actorId ?? m['AdminLogsPage.system']() })}
					</span>
					{#if log.resourceType || log.resourceId}
						<span class="truncate">
							{log.resourceId
								? m['AdminLogsPage.resourceWithId']({
										type: log.resourceType ?? m['AdminLogsPage.resource'](),
										id: log.resourceId
									})
								: (log.resourceType ?? m['AdminLogsPage.resource']())}
						</span>
					{/if}
				</div>
			</TableCell>
			<TableCell>
				<Badge variant={severityVariant(log.severity)} class="capitalize">
					{log.severity}
				</Badge>
			</TableCell>
			<TableCell class="hidden max-w-48 md:table-cell">
				{#if log.actorId}
					<a
						href={resolve('/admin/users/[id]', { id: log.actorId })}
						class="block truncate font-mono text-xs hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
					>
						{log.actorId}
					</a>
				{:else}
					<span class="text-muted-foreground">{m['AdminLogsPage.system']()}</span>
				{/if}
			</TableCell>
			<TableCell class="hidden max-w-56 lg:table-cell">
				{#if log.resourceType || log.resourceId}
					<span
						class="block truncate"
						title={log.resourceId
							? m['AdminLogsPage.resourceWithId']({
									type: log.resourceType ?? m['AdminLogsPage.resource'](),
									id: log.resourceId
								})
							: (log.resourceType ?? m['AdminLogsPage.resource']())}
					>
						{log.resourceId
							? m['AdminLogsPage.resourceWithId']({
									type: log.resourceType ?? m['AdminLogsPage.resource'](),
									id: log.resourceId
								})
							: (log.resourceType ?? m['AdminLogsPage.resource']())}
					</span>
				{:else}
					<span class="text-muted-foreground">{m['AdminLogsPage.none']()}</span>
				{/if}
			</TableCell>
			<TableCell>
				<time datetime={new Date(log.timestamp).toISOString()} class="text-muted-foreground">
					{formatDateTime(log.timestamp, getLocale())}
				</time>
			</TableCell>
		{/snippet}

		{#snippet errorSnippet()}
			<ErrorComponent message={m['AdminLogsPage.loadError']()} />
		{/snippet}

		{#snippet empty()}
			<EmptyData
				title={m['AdminLogsPage.noActivity']()}
				description={m['AdminLogsPage.noActivityDescription']()}
			>
				{#snippet icon()}
					<span class="icon-[lucide--scroll-text] size-4" aria-hidden="true"></span>
				{/snippet}
			</EmptyData>
		{/snippet}
	</DataTable>
</div>
