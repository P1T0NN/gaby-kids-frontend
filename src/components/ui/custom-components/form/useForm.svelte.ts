// LIBRARIES
import { useAction, useMutation } from 'convex-svelte';
import { api } from '@convex/_generated/api';
import { tick } from 'svelte';
import { toast } from 'svelte-sonner';
import { m } from '@/lib/paraglide/messages';

// UTILS
import { optimizeToWebp } from '@/features/storage/utils/optimizeToWebp.js';
import { aggregateUploadProgress } from '@/features/uploadFile/utils/aggregateUploadProgress.js';
import { uploadWithProgress } from '@/features/uploadFile/utils/uploadWithProgress.js';
import { STORAGE_CONFIG } from '@/shared/features/storage/config.js';
import { toastMessage } from '@/utils/toastMessage.js';
import { toHumanMessage } from '@/features/validations/utils/toHumanMessage.js';

// TYPES
import type { PreviewFile } from '@/features/uploadFile/types/uploadFileTypes.js';
import type {
	CustomField,
	CustomFieldContext,
	FieldConfig,
	FormFieldContext,
	FormValue,
	MutationValues,
	PreparedMutationArgs,
	SafeParseSchema,
	UploadPrepareContext
} from './formTypes.js';
import type { FunctionArgs, FunctionReference, FunctionReturnType } from 'convex/server';

type ValidatableControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
type FormBindings<Mutation extends FunctionReference<'mutation' | 'action'>> = {
	get values(): MutationValues<Mutation>;
	set values(values: MutationValues<Mutation>);
	get uploadFiles(): PreviewFile[];
	set uploadFiles(files: PreviewFile[]);
	get submitting(): boolean;
	set submitting(submitting: boolean);
};

type UseFormOptions<Mutation extends FunctionReference<'mutation' | 'action'>> = {
	function: () => Mutation;
	functionType: () => 'mutation' | 'action';
	captchaAction: () => string | undefined;
	captchaToken: () => string;
	executeCaptcha: () => void;
	resetCaptcha: () => void;
	fields: () => FieldConfig[];
	bindings: FormBindings<Mutation>;
	uploadNamespace: () => string | undefined;
	prepareArgs: () =>
		((context: UploadPrepareContext<Mutation>) => PreparedMutationArgs<Mutation>) | undefined;
	schema: () => SafeParseSchema<PreparedMutationArgs<Mutation>> | undefined;
	onSuccess: () => ((result: FunctionReturnType<Mutation>) => void | Promise<void>) | undefined;
	successMessage: () => string;
	errorMessage: () => string;
	uploadErrorMessage: () => string;
	uploadCancelledMessage: () => string;
	resetOnSuccess: () => boolean;
};

function hasUploadField(fields: FieldConfig[]): boolean {
	return fields.some(
		(field) => field.kind === 'upload' || (field.kind === 'section' && hasUploadField(field.fields))
	);
}

export function useForm<Mutation extends FunctionReference<'mutation' | 'action'>>(
	options: UseFormOptions<Mutation>
) {
	let errors = $state<Record<string, string>>({});
	let uploadProgress = $state<number | null>(null);
	let preparingUpload = $state(false);
	let pendingCaptchaForm: HTMLFormElement | undefined;
	// SAFETY: functionType and the generated Convex reference are supplied together by Form.
	const callFunction = (
		options.functionType() === 'action'
			? useAction(options.function() as FunctionReference<'action'>)
			: useMutation(options.function() as FunctionReference<'mutation'>)
	) as (args: FunctionArgs<Mutation>) => Promise<FunctionReturnType<Mutation>>;
	const generateUploadUrl = useMutation(api.storage.r2.generateUploadUrl);
	const syncUploadMetadata = useAction(api.storage.r2.syncMetadata);
	const deleteUpload = useMutation(api.storage.r2.deleteObject);

	const setValue = (name: string, value: FormValue<Mutation> | undefined) => {
		options.bindings.values = { ...options.bindings.values, [name]: value };
		if (errors[name]) errors[name] = '';
	};
	const inputValue = (name: string) => {
		const value = options.bindings.values[name];
		return value === undefined ? '' : String(value);
	};
	const checkboxValue = (name: string) => options.bindings.values[name] === true;
	const fieldContext = $derived<FormFieldContext<FormValue<Mutation>>>({
		get values() {
			return options.bindings.values;
		},
		getValue: (name) => options.bindings.values[name],
		setValue,
		inputValue,
		checkboxValue,
		get disabled() {
			return options.bindings.submitting;
		}
	});

	const customFieldContext = (field: CustomField): CustomFieldContext => ({
		field,
		values: options.bindings.values,
		getValue: (name) => options.bindings.values[name],
		// SAFETY: custom controls own their value type; the Convex validator remains authoritative.
		setValue: (name, value) => setValue(name, value as FormValue<Mutation> | undefined),
		inputValue,
		checkboxValue,
		disabled: options.bindings.submitting
	});

	const focusFirstError = (form: HTMLFormElement) => {
		const field = form.querySelector<HTMLElement>('[aria-invalid="true"], :invalid');
		if (!field) return;
		field.focus({ preventScroll: true });
		field.scrollIntoView({ behavior: 'smooth', block: 'center' });
	};
	const collectValidationErrors = (form: HTMLFormElement) => {
		const nextErrors: Record<string, string> = {};
		const controls = form.querySelectorAll<ValidatableControl>(
			'input:invalid, select:invalid, textarea:invalid'
		);
		for (const control of controls) {
			if (control.name && !nextErrors[control.name])
				nextErrors[control.name] = control.validationMessage;
		}
		return nextErrors;
	};

	const removeUploads = async (keys: string[]) => {
		await Promise.allSettled(keys.map((key) => deleteUpload({ key })));
	};

	const uploadFile = async (file: File, onProgress: (loaded: number, total: number) => void) => {
		const namespace = options.uploadNamespace();
		const upload = await generateUploadUrl(
			namespace
				? { namespace, size: file.size, contentType: file.type }
				: { size: file.size, contentType: file.type }
		);
		let validated: boolean;
		try {
			await uploadWithProgress(
				upload.url,
				file,
				({ loaded, total }) => onProgress(loaded, total),
				options.uploadErrorMessage(),
				options.uploadCancelledMessage()
			);
			validated = await syncUploadMetadata({ key: upload.key });
		} catch (error) {
			await deleteUpload({ key: upload.key }).catch(() => {});
			throw error;
		}
		// A rejected upload has already been removed by the backend.
		if (!validated) throw new Error(options.uploadErrorMessage());
		return upload.key;
	};

	const uploadSelectedFiles = async () => {
		const uploadFiles = options.bindings.uploadFiles;
		if (uploadFiles.length > STORAGE_CONFIG.maxFilesPerUpload) {
			throw new Error(
				m['BackendMessages.tooManyFiles']({ maxFiles: STORAGE_CONFIG.maxFilesPerUpload })
			);
		}
		const localFiles = uploadFiles.flatMap((preview) => (preview.file ? [preview.file] : []));
		preparingUpload = true;
		uploadProgress = 0;
		const files = await Promise.all(
			localFiles.map(async (file) =>
				file.type.startsWith('image/') ? optimizeToWebp(file).catch(() => file) : file
			)
		);
		preparingUpload = false;
		const progress = files.map((file) => ({ loaded: 0, total: file.size }));
		const results = await Promise.allSettled(
			files.map((file, index) =>
				uploadFile(file, (loaded, total) => {
					progress[index] = { loaded, total };
					uploadProgress = aggregateUploadProgress(progress);
				})
			)
		);
		const keys = results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []));
		const failed = results.find((result) => result.status === 'rejected');
		if (failed) {
			await removeUploads(keys);
			throw failed.reason;
		}
		return keys;
	};

	async function submit(
		event: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }
	): Promise<void> {
		event.preventDefault();
		if (options.bindings.submitting) return;
		const captchaAction = options.captchaAction();
		const hasInvalidCaptchaConfiguration =
			captchaAction !== undefined && options.functionType() !== 'action';
		if (hasInvalidCaptchaConfiguration)
			throw new Error('captchaAction requires functionType="action"');

		const form = event.currentTarget;
		errors = collectValidationErrors(form);
		const hasValidationErrors = Object.keys(errors).length > 0;
		if (hasValidationErrors) {
			toast.error(m['Components.Form.fixHighlightedFields']());
			await tick();
			focusFirstError(form);
			return;
		}
		const needsCaptchaVerification = captchaAction !== undefined && !options.captchaToken();
		if (needsCaptchaVerification) {
			pendingCaptchaForm = form;
			options.executeCaptcha();
			return;
		}

		let uploadedFiles: string[] = [];
		let retainedFiles: string[] = [];
		let result: FunctionReturnType<Mutation>;
		const uploadEnabled = hasUploadField(options.fields());
		options.bindings.submitting = true;
		try {
			if (uploadEnabled) {
				retainedFiles = options.bindings.uploadFiles.flatMap((preview) =>
					preview.key ? [preview.key] : []
				);
				const hasNewUploadFiles = options.bindings.uploadFiles.some((preview) => preview.file);
				if (hasNewUploadFiles) {
					uploadedFiles = await uploadSelectedFiles();
					uploadProgress = null;
				}
			}
			const preparedArgs = options.prepareArgs()?.({
				values: { ...options.bindings.values },
				uploadedFiles,
				retainedFiles,
				uploadFiles: [...options.bindings.uploadFiles]
			}) ?? { ...options.bindings.values };
			const parsed = options.schema()?.safeParse(preparedArgs);
			const hasSchemaErrors = parsed !== undefined && !parsed.success;
			if (hasSchemaErrors) {
				errors = Object.fromEntries(
					parsed.error.issues.flatMap((issue) => {
						const field = String(issue.path[0] ?? '');
						return field ? [[field, toHumanMessage(issue.message)]] : [];
					})
				);
				await removeUploads(uploadedFiles);
				toast.error(m['Components.Form.fixHighlightedFields']());
				await tick();
				focusFirstError(form);
				return;
			}
			const validatedArgs = parsed?.success === true ? parsed.data : preparedArgs;
			const mutationArgs = uploadEnabled ? { ...validatedArgs, retainedFiles } : validatedArgs;
			if (uploadedFiles.length > 0) Object.assign(mutationArgs, { uploadedFiles });
			const captchaToken = options.captchaToken();
			const isCaptchaTokenMissing = captchaAction !== undefined && !captchaToken;
			if (isCaptchaTokenMissing) throw new Error(options.errorMessage());
			if (captchaAction) Object.assign(mutationArgs, { turnstileToken: captchaToken });
			// SAFETY: native validation runs first and Convex validators remain authoritative.
			result = await callFunction(mutationArgs as FunctionArgs<Mutation>);
		} catch (error) {
			await removeUploads(uploadedFiles);
			toastMessage({ type: 'error', error, message: options.errorMessage() });
			await tick();
			focusFirstError(form);
			return;
		} finally {
			options.bindings.submitting = false;
			preparingUpload = false;
			uploadProgress = null;
			if (captchaAction) options.resetCaptcha();
		}

		if (options.resetOnSuccess()) {
			form.reset();
			options.bindings.values = {};
			errors = {};
			for (const file of options.bindings.uploadFiles) if (file.file) URL.revokeObjectURL(file.url);
			options.bindings.uploadFiles = [];
		}
		toastMessage({ type: 'success', message: options.successMessage() });
		await options.onSuccess()?.(result);
	}

	return {
		get errors() {
			return errors;
		},
		get fieldContext() {
			return fieldContext;
		},
		get uploadProgress() {
			return uploadProgress;
		},
		get preparingUpload() {
			return preparingUpload;
		},
		setValue,
		inputValue,
		checkboxValue,
		customFieldContext,
		resumeAfterCaptcha() {
			const form = pendingCaptchaForm;
			pendingCaptchaForm = undefined;
			form?.requestSubmit();
		},
		submit
	};
}
