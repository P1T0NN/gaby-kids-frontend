// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare module 'svelte/elements' {
	interface HTMLAttributes<T extends EventTarget> {
		interestfor?: string | undefined | null;
	}
}

declare global {
	namespace App {
		interface Error {
			message: string;
		}
		interface Locals {
			token: string | undefined;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
