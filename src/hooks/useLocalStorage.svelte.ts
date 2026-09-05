// SVELTEKIT IMPORTS
import { browser } from '$app/environment';
import { onMount } from 'svelte';

export function useLocalStorage<T>(key: string, initialValue: T, parse: (raw: string | null) => T) {
	let value = $state<T>(initialValue);
	let loaded = $state(false);
	let error = $state<unknown>(null);

	function read(): boolean {
		if (!browser) return false;

		try {
			value = parse(localStorage.getItem(key));
			error = null;
			return true;
		} catch (cause) {
			error = cause;
			return false;
		}
	}

	function set(nextValue: T): boolean {
		if (!browser) return false;

		try {
			localStorage.setItem(key, JSON.stringify($state.snapshot(nextValue)));
			value = nextValue;
			error = null;
			window.dispatchEvent(new CustomEvent('local-storage-change', { detail: key }));
			return true;
		} catch (cause) {
			error = cause;
			return false;
		}
	}

	function remove(): boolean {
		if (!browser) return false;

		try {
			localStorage.removeItem(key);
			value = initialValue;
			error = null;
			window.dispatchEvent(new CustomEvent('local-storage-change', { detail: key }));
			return true;
		} catch (cause) {
			error = cause;
			return false;
		}
	}

	onMount(() => {
		read();
		loaded = true;

		function handleStorage(event: StorageEvent): void {
			if (event.storageArea !== localStorage || (event.key !== key && event.key !== null)) return;
			read();
		}

		window.addEventListener('storage', handleStorage);
		function handleLocalChange(event: Event): void {
			if (event instanceof CustomEvent && event.detail === key) read();
		}
		window.addEventListener('local-storage-change', handleLocalChange);
		return () => {
			window.removeEventListener('storage', handleStorage);
			window.removeEventListener('local-storage-change', handleLocalChange);
		};
	});

	return {
		get value() {
			return value;
		},
		get loaded() {
			return loaded;
		},
		get error() {
			return error;
		},
		read,
		set,
		remove
	};
}
