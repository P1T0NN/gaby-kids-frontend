// TYPES
import type { BaseField } from './formTypes.js';

/** Shared id/name/aria attributes for the form controls. */
export function formControlAttrs(field: BaseField, error: string | undefined) {
	return {
		id: field.name,
		name: field.name,
		'aria-invalid': error ? ('true' as const) : undefined,
		'aria-describedby': error ? `${field.name}-error` : undefined
	};
}

/** Forward a control's `input` event value to the field setter. */
export function formControlInput(onValueChange: (value: string) => void) {
	return (event: Event & { currentTarget: HTMLInputElement | HTMLTextAreaElement }) =>
		onValueChange(event.currentTarget.value);
}
