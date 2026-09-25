<script lang="ts">
	// COMPONENTS
	import { Progress } from '@/components/ui/progress/index.js';
	import { m } from '@/lib/paraglide/messages';

	let { uploadedBytes, limitBytes }: { uploadedBytes: number; limitBytes: number } = $props();

	let valueBytes = $derived(Math.min(Math.max(uploadedBytes, 0), limitBytes));
	let percentage = $derived(limitBytes > 0 ? (valueBytes / limitBytes) * 100 : 0);
	let indicatorClass = $derived(
		percentage >= 90
			? '[&_[data-slot=progress-indicator]]:bg-destructive'
			: percentage >= 60
				? '[&_[data-slot=progress-indicator]]:bg-warning'
				: '[&_[data-slot=progress-indicator]]:bg-success'
	);
	let uploadedMegabytes = $derived((valueBytes / (1024 * 1024)).toFixed(1));
	let limitMegabytes = $derived((limitBytes / (1024 * 1024)).toFixed(1));
</script>

<div class="flex flex-col gap-2">
	<div class="flex justify-end text-xs text-muted-foreground tabular-nums">
		{uploadedMegabytes} / {limitMegabytes} MB
	</div>
	<Progress
		value={valueBytes}
		max={limitBytes}
		class={'h-2 ' + indicatorClass}
		aria-label={m['Components.FormUploadFile.uploadProgress']()}
		aria-valuetext={uploadedMegabytes + ' / ' + limitMegabytes + ' MB'}
	/>
</div>
