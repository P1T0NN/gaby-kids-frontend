// TYPES
import type { Snippet } from 'svelte';
import type { FunctionArgs, FunctionReference } from 'convex/server';
import type { PreviewFile } from '@/features/uploadFile/types/uploadFileTypes.js';

export type FormFieldValue = string | number | boolean;

type MutationValue<Mutation extends FunctionReference<'mutation' | 'action'>> =
	FunctionArgs<Mutation>[keyof FunctionArgs<Mutation>];
export type FormValue<Mutation extends FunctionReference<'mutation' | 'action'>> =
	MutationValue<Mutation> | FormFieldValue;
export type MutationValues<Mutation extends FunctionReference<'mutation' | 'action'>> = Partial<
	Omit<FunctionArgs<Mutation>, 'uploadedFiles' | 'retainedFiles'>
> &
	Record<string, FormValue<Mutation> | undefined>;
export type UploadPrepareContext<Mutation extends FunctionReference<'mutation' | 'action'>> = {
	values: MutationValues<Mutation>;
	uploadedFiles: string[];
	retainedFiles: string[];
	uploadFiles: PreviewFile[];
};
export type PreparedMutationArgs<Mutation extends FunctionReference<'mutation' | 'action'>> = Omit<
	FunctionArgs<Mutation>,
	'uploadedFiles' | 'retainedFiles'
>;

export type SafeParseSchema<Value extends object> = {
	safeParse: (value: Value) =>
		| { success: true; data: Value }
		| {
				success: false;
				error: { issues: readonly { path: readonly PropertyKey[]; message: string }[] };
		  };
};

export type FormFieldContext<Value = FormFieldValue> = {
	values: Record<string, Value | undefined>;
	getValue: (name: string) => Value | undefined;
	setValue: (name: string, value: Value | undefined) => void;
	inputValue: (name: string) => string;
	checkboxValue: (name: string) => boolean;
	disabled: boolean;
};

export type BaseField = {
	name: string;
	label?: string;
	description?: string;
	placeholder?: string;
	required?: boolean;
	disabled?: boolean;
	/** Extra classes for the wrapping <Field>. */
	class?: string;
};

export type FormSection = {
	kind: 'section';
	/** Card title shown above the grouped fields. */
	title?: string;
	description?: string;
	fields: FieldConfig[];
	/** Extra classes for the wrapping <Card>. */
	class?: string;
};

export type CustomFieldContext = FormFieldContext<unknown> & {
	field: CustomField;
	/** Submitted schema errors keyed by field name; empty when the form is clean. */
	errors: Readonly<Record<string, string>>;
};

export type CustomField = BaseField & {
	kind: 'custom';
	/** Custom control rendered inside the standard field wrapper. */
	render: Snippet<[CustomFieldContext]>;
};

export type InputField = BaseField & {
	kind: 'input';
	type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'search' | 'tel' | 'url';
	maxLength?: number;
	min?: number;
	max?: number;
	step?: number | 'any';
};

export type TextareaField = BaseField & { kind: 'textarea'; maxLength?: number };

export type SelectField = BaseField & {
	kind: 'select';
	options: { value: string; label: string }[];
};

export type CheckboxField = BaseField & { kind: 'checkbox' };
export type SwitchField = BaseField & { kind: 'switch' };

export type UploadMode = 'single' | 'multiple';

export type UploadField = BaseField & {
	kind: 'upload';
	/** Single file by default; use `multiple` to allow several images. */
	mode?: UploadMode;
	/** Accepted file types. */
	accept?: string;
};

export type FormControlField =
	InputField | TextareaField | SelectField | CheckboxField | SwitchField;
export type FieldConfig = FormControlField | FormSection | UploadField | CustomField;

export type ExtraFields<Value = FormFieldValue> = Snippet<[FormFieldContext<Value>]>;
