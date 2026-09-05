<script lang="ts">
	// LIBRARIES
	import { authClient } from '@/features/auth/lib/authClient';

	// COMPONENTS
	import * as Avatar from '@/components/ui/avatar/index.js';
	import LogoutButton from '@/features/auth/components/logout-button/logout-button.svelte';
	import NativePopover from '@/components/ui/native-components/native-popover/native-popover.svelte';
	import { Separator } from '@/components/ui/separator/index.js';

	// UTILS
	import { formatNameInitials } from '@/shared/utils/formatNameInitials';
	import { m } from '@/lib/paraglide/messages';

	const session = authClient.useSession();
	const user = $derived($session.data?.user);
	const userName = $derived(user?.name ?? m['Components.NativeSidebarUser.user']());
	const userEmail = $derived(user?.email ?? '');
	const userImage = $derived(user?.image);
	const userInitials = $derived(formatNameInitials(userName));
</script>

{#if user}
	{#snippet userTrigger()}
		<Avatar.Root aria-hidden="true">
			{#if userImage}
				<Avatar.Image src={userImage} alt="" />
			{/if}
			<Avatar.Fallback>{userInitials}</Avatar.Fallback>
		</Avatar.Root>

		<span class="min-w-0 flex-1">
			<span class="block truncate text-left text-sm font-medium">{userName}</span>
			<span class="block truncate text-left text-xs text-muted-foreground">{userEmail}</span>
		</span>

		<span
			class="icon-[lucide--chevrons-up-down] size-4 shrink-0 text-muted-foreground"
			aria-hidden="true"
		></span>
	{/snippet}

	<NativePopover
		id="sidebar-user-menu"
		align="start"
		side="top"
		trigger={userTrigger}
		triggerClass="w-full justify-start gap-3 rounded-xl p-2 text-left hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
		triggerLabel={m['Components.NativeSidebarUser.openAccountMenu']()}
		class="w-80 max-w-none"
	>
		<div class="flex items-center gap-3 px-2 py-2">
			<Avatar.Root size="lg">
				{#if userImage}
					<Avatar.Image src={userImage} alt={userName} />
				{/if}
				<Avatar.Fallback>{userInitials}</Avatar.Fallback>
			</Avatar.Root>

			<div class="min-w-0">
				<p class="truncate text-sm font-medium text-foreground">{userName}</p>
				<p class="truncate text-xs text-muted-foreground">{userEmail}</p>
			</div>
		</div>

		<Separator class="my-1" />

		<LogoutButton
			class="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
		>
			<span class="icon-[lucide--log-out] size-4" aria-hidden="true"></span>
			<span>{m['Components.NativeSidebarUser.logOut']()}</span>
		</LogoutButton>
	</NativePopover>
{/if}
