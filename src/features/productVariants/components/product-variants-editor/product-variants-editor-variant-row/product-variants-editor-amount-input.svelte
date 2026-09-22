<script lang="ts">
	// COMPONENTS
	import { Input } from '@/components/ui/input/index.js';

	// UTILS
	import {
		formatAmountInput,
		parseAmountInput,
		sanitizeAmountInput
	} from '@/shared/utils/pricing.js';
	import { cn } from '@/utils/utils.js';

	type Props = {
		value: number | undefined;
		/** Decimal places the field accepts and stores; 2 for prices, 0 for stock. */
		decimals: number;
		ariaLabel: string;
		placeholder?: string;
		disabled?: boolean;
		invalid?: boolean;
		class?: string;
		onValueChange: (value: number | undefined) => void;
	};

	let {
		value,
		decimals,
		ariaLabel,
		placeholder,
		disabled = false,
		invalid = false,
		class: className,
		onValueChange
	}: Props = $props();

	let focused = $state(false);
	let draft = $state('');

	// The formatted value shows while idle; the raw, sanitized draft shows while typing.
	const displayValue = $derived(focused ? draft : formatAmountInput(value, decimals));

	function handleFocus(): void {
		draft = formatAmountInput(value, decimals);
		focused = true;
	}

	function handleInput(input: string): void {
		draft = sanitizeAmountInput(input, decimals);
		onValueChange(parseAmountInput(draft, decimals));
	}
</script>

<Input
	type="text"
	inputmode={decimals > 0 ? 'decimal' : 'numeric'}
	value={displayValue}
	{placeholder}
	{disabled}
	aria-label={ariaLabel}
	aria-invalid={invalid ? true : undefined}
	class={cn('h-9', className)}
	onfocus={handleFocus}
	onblur={() => (focused = false)}
	oninput={(event) => handleInput(event.currentTarget.value)}
/>
