<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import AdminDashboardHeaderCustomCalendar from './admin-dashboard-header-custom-calendar.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import * as ToggleGroup from '@/components/ui/toggle-group/index.js';

	// HOOKS
	import {
		PRESET_TIME_RANGES,
		useAnalyticsDashboard
	} from '@/features/analytics/hooks/useAnalyticsDashboard.svelte.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { PresetTimeRange } from '@/shared/features/analytics/types/analyticsTypes.js';

	const analytics = useAnalyticsDashboard();

	const PRESET_LABELS = {
		today: m['AdminDashboardPage.AdminDashboardHeaderTimeranges.today'],
		'7d': m['AdminDashboardPage.AdminDashboardHeaderTimeranges.last7Days'],
		'30d': m['AdminDashboardPage.AdminDashboardHeaderTimeranges.last30Days'],
		'90d': m['AdminDashboardPage.AdminDashboardHeaderTimeranges.last90Days']
	} satisfies Record<PresetTimeRange, () => string>;
</script>

<div class="flex flex-wrap items-center">
	<ToggleGroup.Root
		type="single"
		bind:value={analytics.selectedPreset}
		onValueChange={analytics.handlePresetChange}
		variant="outline"
		size="sm"
		spacing={0}
		aria-label={m['AdminDashboardPage.AdminDashboardHeaderTimeranges.timeRangeLabel']()}
	>
		{#each PRESET_TIME_RANGES as preset, index (preset)}
			<ToggleGroup.Item
				value={preset}
				aria-label={PRESET_LABELS[preset]()}
				class={cn(index === PRESET_TIME_RANGES.length - 1 && 'rounded-r-none!')}
			>
				{PRESET_LABELS[preset]()}
			</ToggleGroup.Item>
		{/each}
	</ToggleGroup.Root>

	<AdminDashboardHeaderCustomCalendar />

	<Button
		variant="outline"
		size="icon-sm"
		class="ms-2"
		onclick={analytics.refresh}
		aria-label={m['AdminDashboardPage.AdminDashboardHeaderTimeranges.refresh']()}
	>
		<span class="icon-[lucide--refresh-cw] size-4" aria-hidden="true"></span>
	</Button>
</div>
