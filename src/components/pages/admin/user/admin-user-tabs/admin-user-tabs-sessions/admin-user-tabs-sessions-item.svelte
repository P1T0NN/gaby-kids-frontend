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
	import { formatDateTime, formatRelativeTime } from '@/shared/utils/date';

	type Session = FunctionReturnType<
		typeof api.betterAuth.tables.users.queries.fetchUserSessionsAdmin.fetchUserSessionsAdmin
	>['items'][number];

	let { session }: { session: Session } = $props();

	const active = $derived(session.expiresAt > Date.now());
</script>

<article
	class="flex min-w-0 flex-col gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5 text-sm"
>
	<div class="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
		<Badge variant={active ? 'outline' : 'secondary'}>
			{active
				? m['AdminUserPage.AdminUserTabsSessionsItem.active']()
				: m['AdminUserPage.AdminUserTabsSessionsItem.expired']()}
		</Badge>
		{#if session.impersonatedBy}
			<Badge variant="outline">{m['AdminUserPage.AdminUserTabsSessionsItem.impersonated']()}</Badge>
		{/if}

		<span class="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
			<span class="icon-[lucide--globe-2] size-3.5 shrink-0" aria-hidden="true"></span>
			{session.ipAddress ?? m['AdminUserPage.AdminUserTabsSessionsItem.ipUnavailable']()}
		</span>

		{#if session.impersonatedBy}
			<span
				class="inline-flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground"
				title={session.impersonatedBy}
			>
				<span class="icon-[lucide--eye] size-3.5 shrink-0" aria-hidden="true"></span>
				<span class="max-w-40 truncate font-mono">
					{m['AdminUserPage.AdminUserTabsSessionsItem.impersonatedBy']({
						user: session.impersonatedBy
					})}
				</span>
			</span>
		{/if}

		<span
			class="inline-flex min-w-0 basis-full items-center gap-1.5 text-xs text-muted-foreground sm:ml-auto sm:basis-auto"
			title={session.userAgent ??
				m['AdminUserPage.AdminUserTabsSessionsItem.userAgentUnavailable']()}
		>
			<span class="icon-[lucide--monitor] size-3.5 shrink-0" aria-hidden="true"></span>
			<span class="truncate font-mono">
				{session.userAgent ?? m['AdminUserPage.AdminUserTabsSessionsItem.userAgentUnavailable']()}
			</span>
		</span>
	</div>

	<dl class="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border pt-2 text-xs">
		<div
			class="inline-flex items-center gap-1 whitespace-nowrap after:ml-1 after:text-border after:content-['-'] last:after:hidden"
		>
			<dt class="text-muted-foreground">
				{m['AdminUserPage.AdminUserTabsSessionsItem.started']()}
			</dt>
			<dd class="font-medium">
				<time
					datetime={new Date(session.createdAt).toISOString()}
					title={formatDateTime(session.createdAt, getLocale())}
				>
					{formatRelativeTime(session.createdAt, getLocale())}
				</time>
			</dd>
		</div>
		<div
			class="inline-flex items-center gap-1 whitespace-nowrap after:ml-1 after:text-border after:content-['-'] last:after:hidden"
		>
			<dt class="text-muted-foreground">
				{m['AdminUserPage.AdminUserTabsSessionsItem.lastActive']()}
			</dt>
			<dd class="font-medium">
				<time
					datetime={new Date(session.updatedAt).toISOString()}
					title={formatDateTime(session.updatedAt, getLocale())}
				>
					{formatRelativeTime(session.updatedAt, getLocale())}
				</time>
			</dd>
		</div>
		<div class="inline-flex items-center gap-1 whitespace-nowrap">
			<dt class="text-muted-foreground">
				{m['AdminUserPage.AdminUserTabsSessionsItem.expires']()}
			</dt>
			<dd class="font-medium">
				<time
					datetime={new Date(session.expiresAt).toISOString()}
					title={formatDateTime(session.expiresAt, getLocale())}
				>
					{formatRelativeTime(session.expiresAt, getLocale())}
				</time>
			</dd>
		</div>
	</dl>
</article>
