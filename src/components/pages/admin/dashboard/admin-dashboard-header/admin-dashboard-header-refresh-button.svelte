<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// HOOKS
	import { useAnalyticsDashboard } from '@/features/analytics/hooks/useAnalyticsDashboard.svelte.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	const analytics = useAnalyticsDashboard();

	const loading = $derived(analytics.statsLoading || analytics.revenueLoading);
</script>

<Button
	variant="outline"
	size="icon-sm"
	class="ms-2"
	onclick={analytics.refresh}
	disabled={loading}
	aria-busy={loading}
	aria-label={m['AdminDashboardPage.AdminDashboardHeaderTimeranges.refresh']()}
>
	<span class={cn('icon-[lucide--refresh-cw] size-4', loading && 'animate-spin')} aria-hidden="true"
	></span>
</Button>
