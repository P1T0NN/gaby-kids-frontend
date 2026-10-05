<script lang="ts">
	// LIBRARIES
	import { DateFormatter, getLocalTimeZone, today, type DateValue } from '@internationalized/date';
	import { getLocale } from '@/lib/paraglide/runtime';
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { Calendar } from '@/components/ui/calendar/index.js';
	import NativePopover from '@/components/ui/native-components/native-popover/native-popover.svelte';

	// UTILS
	import { parseIsoDate, toIsoDate } from '@/shared/utils/date.js';
	import { cn } from '@/utils/utils.js';

	type Props = {
		value: string;
		onValueChange: (value: string) => void;
		disabled?: boolean;
	};

	let { value, onValueChange, disabled = false }: Props = $props();

	const POPOVER_ID = 'add-coupon-expiry-popover';
	const selectedDate = $derived(parseIsoDate(value));
	const minDate = today(getLocalTimeZone());
	const dateFormatter = $derived(
		new DateFormatter(getLocale(), { dateStyle: 'medium', timeZone: 'UTC' })
	);
	const displayValue = $derived(
		selectedDate
			? dateFormatter.format(selectedDate.toDate(getLocalTimeZone()))
			: m['CouponsFeature.AddCouponDialog.pickExpiryDate']()
	);

	function closePopover(): void {
		const popover = document.getElementById(POPOVER_ID);
		if (popover?.matches(':popover-open')) popover.hidePopover();
	}

	function selectDate(date: DateValue | undefined): void {
		onValueChange(date ? toIsoDate(date) : '');
		closePopover();
	}
</script>

{#snippet trigger()}
	<span class={cn('flex w-full items-center gap-2', !selectedDate && 'text-muted-foreground')}>
		<span class="icon-[lucide--calendar] size-4 shrink-0" aria-hidden="true"></span>
		<span class="truncate">{displayValue}</span>
	</span>
{/snippet}

<NativePopover
	id={POPOVER_ID}
	{trigger}
	triggerLabel={m['CouponsFeature.AddCouponDialog.expiresAt']()}
	triggerClass={cn(
		'h-9 w-full justify-start rounded-3xl border border-transparent bg-input/50 px-3 text-sm font-normal',
		disabled && 'pointer-events-none opacity-50'
	)}
	class="w-auto p-0"
>
	<Calendar
		type="single"
		value={selectedDate}
		minValue={minDate}
		locale={getLocale()}
		captionLayout="dropdown"
		onValueChange={selectDate}
	/>
	{#if selectedDate}
		<div class="flex justify-end border-t p-2">
			<Button type="button" variant="ghost" size="sm" onclick={() => selectDate(undefined)}>
				{m['CouponsFeature.AddCouponDialog.clearExpiry']()}
			</Button>
		</div>
	{/if}
</NativePopover>
