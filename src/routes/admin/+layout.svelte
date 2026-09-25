<script lang="ts">
	// LIBRARIES
	import { page } from '$app/state';
	import { useCachedConvexQuery } from '@/hooks/useCachedConvexQuery.svelte.js';

	// CONVEX
	import { api } from '@convex/_generated/api';

	// CONFIG
	import { COMPANY_DATA } from '@/shared/config';
	import { ADMIN_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';
	import { UPSELLS_CONFIG } from '@/shared/features/upsells/config.js';
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import NativeSidebar from '@/components/ui/native-components/native-sidebar/native-sidebar.svelte';
	import NativeSidebarContent from '@/components/ui/native-components/native-sidebar/native-sidebar-content.svelte';
	import NativeSidebarLink from '@/components/ui/native-components/native-sidebar/native-sidebar-link.svelte';
	import NativeSidebarPageHeader from '@/components/ui/native-components/native-sidebar/native-sidebar-page-header.svelte';
	import NativeSidebarSection from '@/components/ui/native-components/native-sidebar/native-sidebar-section.svelte';
	import NativeSidebarUser from '@/components/ui/native-components/native-sidebar/native-sidebar-user.svelte';

	let { children } = $props();
	let mobileSidebarOpen = $state(false);

	const breadcrumbUserId = $derived(
		page.route.id === '/admin/users/[id]' ? page.params.id : undefined
	);
	const breadcrumbUser = useCachedConvexQuery(
		api.betterAuth.tables.users.queries.fetchUserBreadcrumbAdmin.fetchUserBreadcrumbAdmin,
		() => (breadcrumbUserId ? { id: breadcrumbUserId } : 'skip')
	);
</script>

<svelte:head>
	<title>{m['Components.AdminSidebar.pageTitle']()}</title>
</svelte:head>

<div class="flex min-h-screen w-full bg-sidebar">
	<NativeSidebar
		label={m['Components.AdminSidebar.navigationLabel']()}
		bind:openMobile={mobileSidebarOpen}
	>
		{#snippet sidebarHeader()}
			<span class="truncate text-sm font-semibold">{COMPANY_DATA.NAME}</span>
		{/snippet}

		{#snippet sidebarFooter()}
			<NativeSidebarUser />
		{/snippet}

		{#snippet navSecondary()}
			<nav aria-label={m['Components.AdminSidebar.secondaryNavigationLabel']()}>
				<NativeSidebarLink href="/" exact>
					<span class="icon-[lucide--arrow-left] size-4" aria-hidden="true"></span>
					<span>{m['Components.AdminSidebar.backToShop']()}</span>
				</NativeSidebarLink>
			</nav>
		{/snippet}

		<div class="flex flex-col gap-4 p-3">
			<nav
				aria-label={m['Components.AdminSidebar.navigationLabel']()}
				class="flex flex-col gap-1"
			>
				<NativeSidebarSection title={m['Components.AdminSidebar.generalSection']()}>
					<NativeSidebarLink href="/admin/dashboard">
						<span class="icon-[lucide--layout-dashboard] size-4" aria-hidden="true"></span>
						<span>{m['Components.AdminSidebar.dashboard']()}</span>
					</NativeSidebarLink>
					<NativeSidebarLink href="/admin/users">
						<span class="icon-[lucide--users] size-4" aria-hidden="true"></span>
						<span>{m['Components.AdminSidebar.users']()}</span>
					</NativeSidebarLink>
					<NativeSidebarLink href="/admin/orders">
						<span class="icon-[lucide--shopping-bag] size-4" aria-hidden="true"></span>
						<span>{m['Components.AdminSidebar.orders']()}</span>
					</NativeSidebarLink>
				</NativeSidebarSection>

				<NativeSidebarSection title={m['Components.AdminSidebar.productsSection']()}>
					<NativeSidebarLink href="/admin/products">
						<span class="icon-[lucide--package] size-4" aria-hidden="true"></span>
						<span>{m['Components.AdminSidebar.products']()}</span>
					</NativeSidebarLink>
					<NativeSidebarLink href="/admin/categories">
						<span class="icon-[lucide--folder-tree] size-4" aria-hidden="true"></span>
						<span>{m['Components.AdminSidebar.categories']()}</span>
					</NativeSidebarLink>
					{#if UPSELLS_CONFIG.HAS_UPSELLS}
						<NativeSidebarLink href={ADMIN_PAGE_ENDPOINTS.UPSELLS}>
							<span class="icon-[lucide--list-plus] size-4" aria-hidden="true"></span>
							<span>{m['AdminUpsellsPage.pageTitle']()}</span>
						</NativeSidebarLink>
					{/if}
				</NativeSidebarSection>

				<NativeSidebarSection title={m['Components.AdminSidebar.securitySection']()}>
					<NativeSidebarLink href="/admin/logs">
						<span class="icon-[lucide--scroll-text] size-4" aria-hidden="true"></span>
						<span>{m['Components.AdminSidebar.logs']()}</span>
					</NativeSidebarLink>
				</NativeSidebarSection>
			</nav>
		</div>
	</NativeSidebar>

	<main class="flex min-w-0 flex-1 flex-col bg-background md:overflow-hidden md:rounded-s-2xl">
		<NativeSidebarPageHeader
			title={m['Components.AdminSidebar.pageTitle']()}
			rootHref="/admin/dashboard"
			pageName={breadcrumbUser.data?.name}
			sidebarLabel={m['Components.AdminSidebar.openNavigation']()}
			onOpenSidebar={() => (mobileSidebarOpen = true)}
		/>

		<NativeSidebarContent>
			{@render children()}
		</NativeSidebarContent>
	</main>
</div>
