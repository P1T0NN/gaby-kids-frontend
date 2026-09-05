<script lang="ts">
	import { mode } from "mode-watcher";
	import { Toaster as Sonner, type ToasterProps as SonnerProps } from "svelte-sonner";
	let { ...restProps }: SonnerProps = $props();
  </script>
  <Sonner
	theme={mode.current}
	class="toaster group"
	style="--normal-bg: var(--color-popover); --normal-text: var(--color-popover-foreground); --normal-border: var(--color-border);"
	{...restProps}
  >
	{#snippet loadingIcon()}
	  <span class="icon-[lucide--loader-2] size-4 animate-spin"></span>
	{/snippet}
	{#snippet successIcon()}
	  <span class="icon-[lucide--circle-check] size-4"></span>
	{/snippet}
	{#snippet errorIcon()}
	  <span class="icon-[lucide--octagon-x] size-4"></span>
	{/snippet}
	{#snippet infoIcon()}
	  <span class="icon-[lucide--info] size-4"></span>
	{/snippet}
	{#snippet warningIcon()}
	  <span class="icon-[lucide--triangle-alert] size-4"></span>
	{/snippet}
  </Sonner>
  