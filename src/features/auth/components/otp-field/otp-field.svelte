<script lang="ts">
	// COMPONENTS
	import * as Field from '@/components/ui/field/index.js';
	import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp/index.js';

	let { label, value = $bindable('') }: { label: string; value?: string } = $props();
</script>

<Field.Field>
	<Field.Label>{label}</Field.Label>
	<InputOTP maxlength={6} bind:value>
		{#snippet children({ cells })}
			<InputOTPGroup>
				{#each cells as cell, i (i)}
					<InputOTPSlot {cell} />
				{/each}
			</InputOTPGroup>
		{/snippet}
	</InputOTP>
</Field.Field>
