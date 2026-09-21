<script lang="ts">
	// LIBRARIES
	import { getLocalTimeZone, today } from '@internationalized/date';
	import { untrack } from 'svelte';
	import { getLocale } from '@/lib/paraglide/runtime';
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import NativePopover from '@/components/ui/native-components/native-popover/native-popover.svelte';
	import RangeCalendar from '@/components/ui/range-calendar/range-calendar.svelte';
	import { toggleVariants } from '@/components/ui/toggle/index.js';

	// HOOKS
	import { useAnalyticsDashboard } from '@/features/analytics/hooks/useAnalyticsDashboard.svelte.js';
	import { IsMobile } from '@/hooks/is-mobile.svelte.js';

	// UTILS
	import { cn } from '@/utils/utils.js';
	import { toastMessage } from '@/utils/toastMessage.js';

	// TYPES
	import type { DateRange } from 'bits-ui';

	const analytics = useAnalyticsDashboard();

	const CALENDAR_POPOVER_ID = 'dashboard-time-range-calendar';
	const MAX_DATE = today(getLocalTimeZone());
	const isMobile = new IsMobile();

	let calendarRange = $state<DateRange | undefined>(untrack(() => analytics.customRange));
	let calendarKey = $state(0);

	function closeCalendar(): void {
		const popover = document.getElementById(CALENDAR_POPOVER_ID);
		if (popover?.matches(':popover-open')) popover.hidePopover();
	}

	function handleRangeChange(next: DateRange): void {
		calendarRange = next;
		if (!next.start || !next.end) return;

		const applied = analytics.applyCustomRange({ start: next.start, end: next.end });
		if (!applied) {
			calendarRange = undefined;
			calendarKey += 1;
			toastMessage({
				type: 'error',
				error: new Error('Custom range exceeds the maximum of 366 days'),
				message: m['AdminDashboardPage.AdminDashboardHeaderCustomCalendar.rangeTooLong']()
			});
		}

		closeCalendar();
	}
</script>

{#snippet customTrigger()}
	<span>{m['AdminDashboardPage.AdminDashboardHeaderCustomCalendar.custom']()}</span>
{/snippet}

<NativePopover
	id={CALENDAR_POPOVER_ID}
	trigger={customTrigger}
	triggerClass={cn(
		toggleVariants({ variant: 'outline', size: 'sm' }),
		'rounded-none rounded-r-3xl border-l-0',
		analytics.activeRange === 'custom' && 'bg-muted'
	)}
	align="end"
	class="w-auto p-0"
>
	{#key calendarKey}
		<RangeCalendar
			bind:value={calendarRange}
			numberOfMonths={isMobile.current ? 1 : 2}
			locale={getLocale()}
			maxValue={MAX_DATE}
			fixedWeeks
			onValueChange={handleRangeChange}
		/>
	{/key}
</NativePopover>
