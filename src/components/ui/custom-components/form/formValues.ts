// LIBRARIES
import { toHumanMessage } from '@/features/validations/utils/toHumanMessage.js';

// TYPES
import type { FormValue, FormValues } from './formTypes.js';
import type { ZodIssue } from 'zod';

function fieldPath(name: string) {
	const path = name.split('.');
	const invalid = path.some(
		(key) => !key || ['__proto__', 'constructor', 'prototype'].includes(key)
	);
	if (invalid) throw new Error(`Invalid form field path: ${name}`);
	return path;
}

function isFormObject(value: FormValue): value is FormValues {
	return (
		value !== null &&
		Object(value) === value &&
		!Array.isArray(value) &&
		!(value instanceof ArrayBuffer)
	);
}

export function getFormValue(values: FormValues, name: string): FormValue {
	let value: FormValue = values;
	for (const key of fieldPath(name)) {
		if (!isFormObject(value) || !Object.hasOwn(value, key)) return undefined;
		value = value[key];
	}
	return value;
}

/** Copy the edited path so nested edits never mutate a parent's initial values. */
export function setFormValue(values: FormValues, name: string, value: FormValue): FormValues {
	const path = fieldPath(name);
	const next = { ...values };
	let target = next;
	for (const key of path.slice(0, -1)) {
		const child = Object.hasOwn(target, key) ? target[key] : undefined;
		if (child !== undefined && !isFormObject(child))
			throw new Error(`Form field path crosses a non-object: ${name}`);
		target[key] = { ...child };
		target = target[key];
	}
	target[path[path.length - 1]] = value;
	return next;
}

export function formValidationErrors(issues: ZodIssue[]) {
	const errors = new Map<string, string>();
	for (const issue of issues) {
		const name = issue.path.join('.');
		if (!errors.has(name)) errors.set(name, toHumanMessage(issue.message));
	}
	return Object.fromEntries(errors);
}
