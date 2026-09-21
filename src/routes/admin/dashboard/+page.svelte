<script lang="ts">
	// LIBRARIES
	import { useConvexClient } from 'convex-svelte';
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import AdminDashboardHeader from '@/components/pages/admin/dashboard/admin-dashboard-header/admin-dashboard-header.svelte';
	import AdminDashboardRevenueChart from '@/components/pages/admin/dashboard/admin-dashboard-revenue-chart/admin-dashboard-revenue-chart.svelte';
	import AdminDashboardStats from '@/components/pages/admin/dashboard/admin-dashboard-stats/admin-dashboard-stats.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';

	// HOOKS
	import { createAnalyticsDashboard } from '@/features/analytics/hooks/useAnalyticsDashboard.svelte.js';

	const client = useConvexClient();
	
	createAnalyticsDashboard(client);
</script>

<SvelteHead title={m['AdminDashboardPage.pageTitle']()} noindex />

<div class="flex min-h-full min-w-0 flex-1 flex-col gap-6">
	<AdminDashboardHeader />

	<AdminDashboardStats />

	<AdminDashboardRevenueChart />
</div>
