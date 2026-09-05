// SVELTEKIT IMPORTS
import { onMount } from 'svelte';

type DebouncedCallback = () => void;

/** Schedule one callback after the delay, replacing any pending callback. */
export function useDebounce(delay = 500) {
	let timer: ReturnType<typeof setTimeout> | undefined;

	function cancel(): void {
		clearTimeout(timer);
		timer = undefined;
	}

	function schedule(callback: DebouncedCallback): void {
		cancel();
		timer = setTimeout(() => {
			timer = undefined;
			callback();
		}, delay);
	}

	onMount(() => cancel);

	return { schedule, cancel };
}
