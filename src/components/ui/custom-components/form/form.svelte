<script lang="ts" generics="Mutation extends FunctionReference<'mutation' | 'action'>">
	// COMPONENTS
	import CaptchaField from '@/features/captcha/components/captcha-field.svelte';
	import FormCheckbox from './form-checkbox.svelte';
	import FormSwitch from './form-switch.svelte';
	import FormField from './form-field.svelte';
	import FormInput from './form-input.svelte';
	import FormSection from './form-section.svelte';
	import FormSelect from './form-select.svelte';
	import FormTextarea from './form-textarea.svelte';
	import FormUploadFile from './form-upload-file.svelte';
	import { m } from '@/lib/paraglide/messages';

	// HOOKS
	import { useCaptcha } from '@/features/captcha/hooks/useCaptcha.svelte';
	import { useForm } from './useForm.svelte.js';

	// UTILS
	import { cn, type WithElementRef } from '@/utils/utils.js';

	// TYPES
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';
	import type { FunctionReference, FunctionReturnType } from 'convex/server';
	import type {
		FieldConfig,
		CustomFields,
		FormSchema,
		InputField,
		MutationValues,
		SelectField,
		TextareaField,
		UploadContext
	} from './formTypes.js';
	import type { PreviewFile } from '@/features/uploadFile/types/uploadFileTypes.js';

	type Props = Omit<WithElementRef<HTMLAttributes<HTMLFormElement>>, 'onsubmit'> & {
		function: Mutation;
		schema: FormSchema;
		functionType?: 'mutation' | 'action';
		captchaAction?: string;
		fields?: FieldConfig[];
		/** Additional payload values, merged before schema validation. */
		extraFields?: MutationValues<Mutation>;
		/** Upload-aware payload values; resolved before and after the uploads finish. */
		resolveExtraFields?: (uploads: UploadContext) => MutationValues<Mutation>;
		customFields?: CustomFields;
		onSuccess?: (result: FunctionReturnType<Mutation>) => void | Promise<void>;
		successMessage?: string;
		errorMessage?: string;
		uploadErrorMessage?: string;
		uploadCancelledMessage?: string;
		resetOnSuccess?: boolean;
		uploadFiles?: PreviewFile[];
		uploadNamespace?: string;
		values?: MutationValues<Mutation>;
		submitting?: boolean;
		children?: Snippet;
	};

	let {
		function: convexFunction,
		schema,
		functionType = 'mutation',
		captchaAction,
		fields = [],
		extraFields,
		resolveExtraFields,
		customFields,
		onSuccess,
		successMessage = m['Components.Form.savedSuccessfully'](),
		errorMessage = m['Components.Form.somethingWentWrong'](),
		uploadErrorMessage = m['Components.Form.uploadFailed'](),
		uploadCancelledMessage = m['Components.Form.uploadCancelled'](),
		resetOnSuccess = true,
		uploadFiles = $bindable<PreviewFile[]>([]),
		uploadNamespace,
		values = $bindable<MutationValues<Mutation>>({}),
		submitting = $bindable(false),
		id,
		class: className,
		children,
		...restProps
	}: Props = $props();

	const captcha = useCaptcha();
	const form = useForm(
		() => ({
			function: convexFunction,
			schema,
			functionType,
			captchaAction,
			fields,
			uploadNamespace,
			extraFields,
			resolveExtraFields,
			onSuccess,
			successMessage,
			errorMessage,
			uploadErrorMessage,
			uploadCancelledMessage,
			resetOnSuccess
		}),
		{
			get values() {
				return values;
			},
			set values(nextValues) {
				values = nextValues;
			},
			get uploadFiles() {
				return uploadFiles;
			},
			set uploadFiles(nextFiles) {
				uploadFiles = nextFiles;
			},
			get submitting() {
				return submitting;
			},
			set submitting(nextSubmitting) {
				submitting = nextSubmitting;
			}
		},
		captcha
	);

	const handleCaptchaToken = (token: string) => {
		captcha.setToken(token);
		if (token) form.resumeAfterCaptcha();
	};

	const fieldKey = (field: FieldConfig, index: number) =>
		field.kind === 'section' ? 'section-' + index : field.name;

	// Shared bindings for the text-like controls; only the rendered component differs.
	function controlProps(field: InputField | TextareaField | SelectField) {
		return {
			value: form.inputValue(field.name),
			disabled: submitting || field.disabled,
			error: form.errors[field.name],
			onValueChange: (value: string) => form.setValue(field.name, value)
		};
	}
</script>

{#snippet renderLocalField(field: FieldConfig)}
	{#if field.kind === 'input'}
		<FormInput {field} {...controlProps(field)} />
	{:else if field.kind === 'textarea'}
		<FormTextarea {field} {...controlProps(field)} />
	{:else if field.kind === 'select'}
		<FormSelect {field} {...controlProps(field)} />
	{:else if field.kind === 'checkbox'}
		<FormCheckbox
			{field}
			checked={form.checkboxValue(field.name)}
			error={form.errors[field.name]}
			disabled={submitting || field.disabled}
			onCheckedChange={(checked) => form.setValue(field.name, checked)}
		/>
	{:else if field.kind === 'switch'}
		<FormSwitch
			{field}
			checked={form.checkboxValue(field.name)}
			disabled={submitting || field.disabled}
			error={form.errors[field.name]}
			onCheckedChange={(checked) => form.setValue(field.name, checked)}
		/>
	{:else if field.kind === 'upload'}
		<FormUploadFile
			{field}
			bind:uploadFiles
			{submitting}
			error={form.errors[field.name]}
			uploadProgress={form.uploadProgress}
			preparingUpload={form.preparingUpload}
		/>
	{:else if field.kind === 'section'}
		<FormSection {field} renderField={renderLocalField} />
	{:else if field.kind === 'custom'}
		<FormField {field} error={form.errors[field.name]} disabled={submitting || field.disabled}>
			{@render field.render(form.customFieldContext(field))}
		</FormField>
	{/if}
{/snippet}

<form
	{id}
	class={cn('flex flex-col gap-6', className)}
	{...restProps}
	novalidate
	onsubmit={form.submit}
	aria-busy={submitting}
>
	{#each fields as field, index (fieldKey(field, index))}
		{@render renderLocalField(field)}
	{/each}

	{@render customFields?.(form.fieldContext)}

	{#if captchaAction}
		<CaptchaField
			action={captchaAction}
			executeOnDemand
			onToken={handleCaptchaToken}
			onReset={captcha.registerReset}
			onExecute={captcha.registerExecute}
		/>
	{/if}

	{@render children?.()}
</form>
