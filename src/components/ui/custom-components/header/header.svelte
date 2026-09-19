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
	import Logo from '@/components/ui/custom-components/logo/logo.svelte';
	import NativeAvatar from '@/components/ui/native-components/native-avatar/native-avatar.svelte';
	import NativePopover from '@/components/ui/native-components/native-popover/native-popover.svelte';
	import { Separator } from '@/components/ui/separator/index.js';
	import { m } from '@/lib/paraglide/messages';
	import Link from '@/components/ui/custom-components/link/link.svelte';

	const session = authClient.useSession();

	const navigation = [
		{ label: m['Components.Header.navShop'](), href: UNPROTECTED_PAGE_ENDPOINTS.SHOP },
		{
			label: m['Components.Header.navBaptism'](),
			href: `${UNPROTECTED_PAGE_ENDPOINTS.SHOP}?category=bautizo`
		},
		{
			label: m['Components.Header.navFirstCommunion'](),
			href: `${UNPROTECTED_PAGE_ENDPOINTS.SHOP}?category=primera-comunion`
		},
		{
			label: m['Components.Header.navGuayaberas'](),
			href: `${UNPROTECTED_PAGE_ENDPOINTS.SHOP}?category=guayaberas`
		},
		{ label: m['Components.Header.navWholesale'](), href: UNPROTECTED_PAGE_ENDPOINTS.CONTACT }
	];
</script>

{#snippet avatar()}
	<NativeAvatar name={$session.data?.user?.name ?? ''} image={$session.data?.user?.image} />
{/snippet}

<p
	class="flex h-9 items-center justify-center bg-foreground px-4 text-center text-xs tracking-wider text-background"
>
	{m['Components.Header.announcement']()}
</p>

<header class="sticky top-0 z-40 border-b border-border bg-background">
	<div class="mx-auto flex h-21 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
		<Link href={UNPROTECTED_PAGE_ENDPOINTS.ROOT} aria-label={COMPANY_DATA.NAME} class="shrink-0">
			<Logo />
		</Link>

		<nav
			class="hidden items-center gap-8 lg:flex"
			aria-label={m['Components.Header.primaryNavigation']()}
		>
			{#each navigation as item (item.label)}
				<Link href={item.href} class="text-sm text-foreground transition-colors hover:text-accent">
					{item.label}
				</Link>
			{/each}
		</nav>

		<div class="flex items-center gap-5">
			<Cart />
			{#if $session.data?.user?.role === 'admin'}
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

					<Separator class="my-1" />

					<Link
						href={ADMIN_PAGE_ENDPOINTS.DASHBOARD}
						class="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
					>
						<span class="icon-[lucide--layout-dashboard] size-4" aria-hidden="true"></span>
						{m['Components.Header.adminDashboard']()}
					</Link>
					<Separator class="my-1" />

					<LogoutButton
						class="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
					>
						<span class="icon-[lucide--log-out] size-4"></span>
						{m['Components.Header.signOut']()}
					</LogoutButton>
				</NativePopover>
			{/if}
		</div>
	</div>
</header>
