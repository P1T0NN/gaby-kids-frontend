<script lang="ts">
	import { asset } from '$app/paths';
	import type { HTMLImgAttributes } from 'svelte/elements';

	let { src, ...rest }: HTMLImgAttributes = $props();
</script>

<img {...rest} src={src ? asset(src) : src} />
