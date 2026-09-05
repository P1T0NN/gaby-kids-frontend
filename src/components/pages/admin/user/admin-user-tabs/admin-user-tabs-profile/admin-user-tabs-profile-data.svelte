<script lang="ts">
	// COMPONENTS
	import * as Avatar from '@/components/ui/avatar';
	import { Badge } from '@/components/ui/badge';
	import * as Card from '@/components/ui/card';
	import CopyValue from '@/components/ui/custom-components/copy-value/copy-value.svelte';
	import { m } from '@/lib/paraglide/messages';

	let {
		id,
		userId,
		name,
		email,
		emailVerified,
		image,
		role,
		banned
	}: {
		id: string;
		userId: string | null;
		name: string;
		email: string;
		emailVerified: boolean;
		image: string | null;
		role: string;
		banned: boolean;
	} = $props();

	function getInitials(value: string): string {
		const parts = value.trim().split(/\s+/).filter(Boolean);
		if (parts.length === 0) return '?';
		if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
		return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
	}
</script>

<Card.Root>
	<Card.Header class="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
		<div class="flex min-w-0 gap-4">
			<Avatar.Root size="lg" aria-hidden="true">
				<Avatar.Image src={image ?? undefined} alt="" />
				<Avatar.Fallback>{getInitials(name)}</Avatar.Fallback>
			</Avatar.Root>

			<div class="flex min-w-0 flex-col gap-2.5">
				<div>
					<h2 id="account-heading" class="truncate text-xl font-semibold tracking-tight">
						{name}
					</h2>
					<div
						class="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground"
					>
						<a
							href="mailto:{email}"
							class="truncate underline-offset-4 hover:text-foreground hover:underline"
						>
							{email}
						</a>
						{#if emailVerified}
							<span class="inline-flex items-center gap-1 text-xs text-primary">
								<span class="icon-[lucide--check] size-3.5" aria-hidden="true"></span>
								{m['AdminUserPage.AdminUserTabsProfileData.verified']()}
							</span>
						{:else}
							<Badge variant="outline"
								>{m['AdminUserPage.AdminUserTabsProfileData.unverified']()}</Badge
							>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<div class="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
			<Badge variant={role === 'admin' ? 'default' : 'secondary'} class="capitalize">
				{role}
			</Badge>
			<Badge variant={banned ? 'destructive' : 'outline'}>
				{banned
					? m['AdminUserPage.AdminUserTabsProfileData.banned']()
					: m['AdminUserPage.AdminUserTabsProfileData.active']()}
			</Badge>
		</div>
	</Card.Header>

	<Card.Content class="border-t border-border pt-4">
		<div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
			<CopyValue
				label={m['AdminUserPage.AdminUserTabsProfileData.id']()}
				value={id}
				ariaLabel={m['AdminUserPage.AdminUserTabsProfileData.copyUserId']()}
			/>
			{#if userId}
				<span class="hidden text-border sm:inline" aria-hidden="true">&middot;</span>
				<CopyValue
					label={m['AdminUserPage.AdminUserTabsProfileData.appId']()}
					value={userId}
					ariaLabel={m['AdminUserPage.AdminUserTabsProfileData.copyAppUserId']()}
				/>
			{/if}
		</div>
	</Card.Content>
</Card.Root>
