<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime';

	// COMPONENTS
	import NativePopover from '@/components/ui/native-components/native-popover/native-popover.svelte';
	import RangeCalendar from '@/components/ui/range-calendar/range-calendar.svelte';
	import * as ToggleGroup from '@/components/ui/toggle-group/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { AnalyticsDashboardApi } from '@/features/analytics/types/analyticsTypes.js';
	import type { DateRange } from 'bits-ui';

	let { dashboard }: { dashboard: AnalyticsDashboardApi } = $props();

	const uid = $props.id();
	const popoverId = `admin-dashboard-range-${uid}`;
	const locale = getLocale();

	let draftRange = $state<DateRange | undefined>(undefined);

	function closeRangePopover() {
		document.getElementById(popoverId)?.hidePopover();
	}

	function handleCustomRangeChange(range: DateRange | undefined) {
		draftRange = range;

		if (!range) return;

		if (dashboard.applyCustomRange(range)) {
			closeRangePopover();
			return;
		}

		draftRange = dashboard.customRange;
	}
</script>

<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
	<div class="flex flex-col gap-1">
		<h1 class="text-2xl font-semibold tracking-tight">{m['AdminDashboardPage.AdminDashboardHeader.title']()}</h1>
		<p class="text-sm text-muted-foreground">{m['AdminDashboardPage.AdminDashboardHeader.description']()}</p>
	</div>

	<div class="flex flex-wrap items-center gap-2">
		<ToggleGroup.Root
			type="single"
			bind:value={dashboard.groupValue}
			variant="outline"
			size="sm"
			spacing={0}
			class="max-w-full overflow-x-auto"
			aria-label={m['AdminDashboardPage.AdminDashboardHeader.rangeAriaLabel']()}
		>
			<ToggleGroup.Item value="today" aria-label={m['AdminDashboardPage.AdminDashboardHeader.todayAriaLabel']()}>
				{m['AdminDashboardPage.AdminDashboardHeader.today']()}
			</ToggleGroup.Item>

			<ToggleGroup.Item
				value="7d"
				aria-label={m['AdminDashboardPage.AdminDashboardHeader.presetAriaLabel']({ days: 7 })}
			>
				{m['AdminDashboardPage.AdminDashboardHeader.days7']()}
			</ToggleGroup.Item>

			<ToggleGroup.Item
				value="30d"
				aria-label={m['AdminDashboardPage.AdminDashboardHeader.presetAriaLabel']({ days: 30 })}
			>
				{m['AdminDashboardPage.AdminDashboardHeader.days30']()}
			</ToggleGroup.Item>

			<ToggleGroup.Item
				value="90d"
				aria-label={m['AdminDashboardPage.AdminDashboardHeader.presetAriaLabel']({ days: 90 })}
			>
				{m['AdminDashboardPage.AdminDashboardHeader.days90']()}
			</ToggleGroup.Item>
		</ToggleGroup.Root>

		<NativePopover
			id={popoverId}
			triggerLabel={m['AdminDashboardPage.AdminDashboardHeader.customAriaLabel']()}
			triggerClass={cn(
				'h-8 min-w-8 gap-1 rounded-3xl border border-input bg-transparent px-3 text-sm font-medium transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/30',
				dashboard.groupValue === 'custom' && 'bg-muted'
			)}
			class="w-auto overflow-hidden p-0"
		>
			{#snippet trigger()}
				<span class="icon-[lucide--calendar] size-4" aria-hidden="true"></span>
				{m['AdminDashboardPage.AdminDashboardHeader.custom']()}
			{/snippet}

			<RangeCalendar
				bind:value={draftRange}
				onValueChange={handleCustomRangeChange}
				numberOfMonths={2}
				captionLayout="dropdown"
				fixedWeeks
				{locale}
				minValue={dashboard.minDate}
				maxValue={dashboard.maxDate}
				class="w-full"
			/>
		</NativePopover>
	</div>
</div>
