// SVELTEKIT IMPORTS
import { untrack } from 'svelte';

type FormObject = { [key: string]: FormValue };
type FormValue = string | number | boolean | null | undefined | Date | FormValue[] | FormObject;
type FormValues = FormObject;

type FormChanges<T extends FormValues> = {
	values: T;
	readonly isDirty: boolean;
	readonly changedValues: Partial<T>;
};

function isFormObject(value: FormValue): value is FormObject {
	return (
		value !== null && Object(value) === value && !Array.isArray(value) && !(value instanceof Date)
	);
}

function areEqual(
	left: FormValue,
	right: FormValue,
	seen = new WeakMap<object, object>()
): boolean {
	if (Object.is(left, right)) return true;
	if (left === null || right === null) return false;

	if (left instanceof Date || right instanceof Date) {
		return (
			left instanceof Date && right instanceof Date && Object.is(left.getTime(), right.getTime())
		);
	}

	if (Array.isArray(left) || Array.isArray(right)) {
		if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
		return left.every((value, index) => areEqual(value, right[index], seen));
	}

	if (!isFormObject(left) || !isFormObject(right)) return false;
	if (Object.getPrototypeOf(left) !== Object.getPrototypeOf(right)) return false;

	const matched = seen.get(left);
	if (matched) return matched === right;
	seen.set(left, right);

	const leftKeys = Object.keys(left);
	const rightKeys = Object.keys(right);
	if (leftKeys.length !== rightKeys.length) return false;

	return leftKeys.every(
		(key) =>
			Object.prototype.hasOwnProperty.call(right, key) && areEqual(left[key], right[key], seen)
	);
}

export function getChangedValues<T extends FormValues>(
	initialValues: T,
	currentValues: T
): Partial<T> {
	const changedValues: Partial<T> = {};
	// SAFETY: T is a string-keyed form object, so these enumerable keys are keyof T.
	const keys = Object.keys({ ...initialValues, ...currentValues }) as Array<keyof T>;

	for (const key of keys) {
		if (!areEqual(initialValues[key], currentValues[key])) changedValues[key] = currentValues[key];
	}

	return changedValues;
}

function snapshotFormValues<T extends FormValues>(values: T): T {
	// SAFETY: $state.snapshot preserves the form object's keys and values while removing its proxy.
	return $state.snapshot(values) as T;
}

export function useFormChanges<T extends FormValues>(getInitialValues: () => T): FormChanges<T> {
	let values = $state(getInitialValues());
	const initialSnapshot = untrack(() => snapshotFormValues(values));
	const changedValues = $derived.by(() =>
		getChangedValues(initialSnapshot, snapshotFormValues(values))
	);

	return {
		get values() {
			return values;
		},
		set values(nextValues: T) {
			values = nextValues;
		},
		get isDirty() {
			return Object.keys(changedValues).length > 0;
		},
		get changedValues() {
			return changedValues;
		}
	};
}
