export function focusFirstError(form: HTMLFormElement): void {
	const field = form.querySelector<HTMLElement>('[aria-invalid="true"]');
	if (!field) return;
	field.focus({ preventScroll: true });
	field.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
