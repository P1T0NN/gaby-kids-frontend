<script lang="ts">
	// CONSTANTS
	import { COMPANY_DATA } from '@/shared/config';

	// COMPONENTS
	import StaticImage from '@/components/ui/custom-components/static-image/static-image.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { HTMLAttributes } from 'svelte/elements';

	type Props = HTMLAttributes<HTMLDivElement> & {
		/** Render the company name next to the logo mark. */
		withCompanyName?: boolean;
	};

	let { withCompanyName = false, class: className, ...restProps }: Props = $props();
</script>

<div class={cn('flex items-center gap-2', className)} {...restProps}>
	<StaticImage src="/logo/opt/logo-transparent-640w.webp" alt={COMPANY_DATA.NAME} class="-my-4 h-16 w-auto" />
	{#if withCompanyName}
		<span class="text-lg font-semibold tracking-tight">{COMPANY_DATA.NAME}</span>
	{/if}
</div>
