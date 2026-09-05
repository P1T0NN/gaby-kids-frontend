<script lang="ts">
	let {
		adminLabel,
		heading,
		description
	}: { adminLabel: string; heading: string; description: string } = $props();
</script>

<header class="flex flex-col gap-1">
	<p class="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
		{adminLabel}
	</p>
	<h1 class="text-2xl font-semibold tracking-tight">{heading}</h1>
	<p class="text-sm text-muted-foreground">{description}</p>
</header>
