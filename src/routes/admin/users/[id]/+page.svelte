<script lang="ts">
	// COMPONENTS
	import AdminUserHeader from '@/components/pages/admin/user/admin-user-header.svelte';
	import AdminUserTabs from '@/components/pages/admin/user/admin-user-tabs/admin-user-tabs.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import { m } from '@/lib/paraglide/messages';

	let { params } = $props();
	// SAFETY: This page is rendered only for the `[id]` route segment.
	const userId = $derived(params.id as string);
</script>

<SvelteHead title={m['AdminUserPage.pageTitle']()} noindex />

<div class="flex min-h-full min-w-0 flex-1 flex-col gap-6">
	<div class="flex w-full flex-col gap-6">
		<AdminUserHeader />
		<AdminUserTabs {userId} />
	</div>
</div>
