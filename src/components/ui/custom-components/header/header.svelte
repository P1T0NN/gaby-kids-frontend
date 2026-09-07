<script lang="ts">
	// LIBRARIES
	import { authClient } from '@/features/auth/lib/authClient';

	// CONSTANTS
	import {
		ADMIN_PAGE_ENDPOINTS,
		UNPROTECTED_PAGE_ENDPOINTS
	} from '@/shared/constants/pageEndpoints';
	import { COMPANY_DATA } from '@/shared/config';

	// COMPONENTS
	import Cart from '@/features/cart/components/cart/cart.svelte';
	import LogoutButton from '@/features/auth/components/logout-button/logout-button.svelte';
	import NativeAvatar from '@/components/ui/native-components/native-avatar/native-avatar.svelte';
	import NativePopover from '@/components/ui/native-components/native-popover/native-popover.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import { Separator } from '@/components/ui/separator/index.js';
	import Spinner from '@/components/ui/spinner/spinner.svelte';
	import { m } from '@/lib/paraglide/messages';
	import Link from '@/components/ui/custom-components/link/link.svelte';
	import ButtonLink from '@/components/ui/custom-components/button-link/button-link.svelte';

	const session = authClient.useSession();
</script>

{#snippet avatar()}
	<NativeAvatar name={$session.data?.user?.name ?? ''} image={$session.data?.user?.image} />
{/snippet}

<header class="sticky top-0 z-40 border-b bg-background">
	<div class="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
		<Link href={UNPROTECTED_PAGE_ENDPOINTS.ROOT} class="text-lg font-semibold tracking-tight">
			{COMPANY_DATA.NAME}
		</Link>

		<nav class="flex items-center gap-1" aria-label={m['Components.Header.primaryNavigation']()}>
			<Link
				href={UNPROTECTED_PAGE_ENDPOINTS.ROOT}
				class="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
			>
				{m['Components.Header.home']()}
			</Link>
			<Link
				href={UNPROTECTED_PAGE_ENDPOINTS.SHOP}
				class="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
			>
				{m['Components.Header.shop']()}
			</Link>
		</nav>

		<div class="flex items-center gap-2">
			<Cart />
			{#if $session.isPending}
				<Spinner />
			{:else if $session.data?.user}
				<NativePopover id="user-menu" align="end" trigger={avatar} class="w-56" closeOnClick>
					<div class="flex items-center gap-3 px-2 py-2">
						{@render avatar()}

						<div class="min-w-0">
							<p class="truncate text-sm font-medium text-foreground">
								{$session.data?.user?.name}
							</p>
							<p class="truncate text-xs text-muted-foreground">{$session.data?.user?.email}</p>
						</div>
					</div>

					<Separator class="my-1" />

					<Link
						href={UNPROTECTED_PAGE_ENDPOINTS.MY_ORDERS}
						class="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
					>
						<span class="icon-[lucide--package] size-4" aria-hidden="true"></span>
						{m['Components.Header.myOrders']()}
					</Link>

					{#if $session.data.user.role === 'admin'}
						<Separator class="my-1" />
						<Link
							href={ADMIN_PAGE_ENDPOINTS.DASHBOARD}
							class="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
						>
							<span class="icon-[lucide--layout-dashboard] size-4" aria-hidden="true"></span>
							{m['Components.Header.adminDashboard']()}
						</Link>
					{/if}
					<Separator class="my-1" />

					<LogoutButton
						class="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
					>
						<span class="icon-[lucide--log-out] size-4"></span>
						{m['Components.Header.signOut']()}
					</LogoutButton>
				</NativePopover>
			{:else}
				<ButtonLink href={UNPROTECTED_PAGE_ENDPOINTS.SIGN_IN} variant="outline">
					{m['Components.Header.signIn']()}
				</ButtonLink>
			{/if}
		</div>
	</div>
</header>
