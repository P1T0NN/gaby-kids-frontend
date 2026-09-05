<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	type Props = {
		value: number;
		onValueChange: (value: number) => void;
		min?: number;
		max?: number;
		decreaseLabel: string;
		increaseLabel: string;
	};

	let {
		value,
		onValueChange,
		min = 1,
		max = Number.MAX_SAFE_INTEGER,
		decreaseLabel,
		increaseLabel
	}: Props = $props();

	const decrease = () => {
		if (value > min) onValueChange(value - 1);
	};
	const increase = () => {
		if (value < max) onValueChange(value + 1);
	};
</script>

<div class="inline-flex items-center gap-1">
	<Button
		variant="outline"
		size="icon-xs"
		type="button"
		aria-label={decreaseLabel}
		disabled={value <= min}
		onclick={decrease}
	>
		<span class="icon-[lucide--minus]" aria-hidden="true"></span>
	</Button>

	<span class="min-w-6 text-center text-sm font-medium tabular-nums" aria-live="polite"
		>{value}</span
	>
	
	<Button
		variant="outline"
		size="icon-xs"
		type="button"
		aria-label={increaseLabel}
		disabled={value >= max}
		onclick={increase}
	>
		<span class="icon-[lucide--plus]" aria-hidden="true"></span>
	</Button>
</div>
