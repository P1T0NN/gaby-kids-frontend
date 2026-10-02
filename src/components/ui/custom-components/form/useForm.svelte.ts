// LIBRARIES
import { useAction, useMutation } from 'convex-svelte';
import { ConvexError } from 'convex/values';
import { api } from '@convex/_generated/api';
import { tick } from 'svelte';
import { toast } from 'svelte-sonner';
import { m } from '@/lib/paraglide/messages';

// UTILS
import { aggregateUploadProgress } from '@/features/uploadFile/utils/aggregateUploadProgress.js';
import { uploadWithProgress } from '@/features/uploadFile/utils/uploadWithProgress.js';
import { linearFind } from '@/shared/lib/algorithms/index.js';
import { exceedsUploadBatchLimit } from '@/shared/features/storage/utils/exceedsUploadBatchLimit.js';
import { STORAGE_CONFIG } from '@/shared/features/storage/config.js';
import { toastMessage } from '@/utils/toastMessage.js';
import { focusFirstError } from '@/utils/focusFirstError.js';
import { formValidationErrors, getFormValue, setFormValue } from './formValues.js';

// TYPES
import type { PreviewFile } from '@/features/uploadFile/types/uploadFileTypes.js';
import type { CaptchaApi } from '@/features/captcha/hooks/useCaptcha.svelte.js';
import type {
	CustomField,
	CustomFieldContext,
	FieldConfig,
	FormFieldContext,
	FormSchema,
	FormValue,
	MutationValues,
	UploadContext
} from './formTypes.js';
import type { FunctionArgs, FunctionReference, FunctionReturnType } from 'convex/server';
import type { BackendErrorData } from '@/shared/types/types.js';

type FormBindings<Mutation extends FunctionReference<'mutation' | 'action'>> = {
	values: MutationValues<Mutation>;
	uploadFiles: PreviewFile[];
	submitting: boolean;
};

type UseFormOptions<Mutation extends FunctionReference<'mutation' | 'action'>> = {
	function: Mutation;
	schema: FormSchema;
	functionType: 'mutation' | 'action';
	captchaAction?: string;
	fields: FieldConfig[];
	uploadNamespace?: string;
	extraFields?: MutationValues<Mutation>;
	resolveExtraFields?: (uploads: UploadContext) => MutationValues<Mutation>;
	onSuccess?: (result: FunctionReturnType<Mutation>) => void | Promise<void>;
	successMessage: string;
	errorMessage: string;
	uploadErrorMessage: string;
	uploadCancelledMessage: string;
	resetOnSuccess: boolean;
};

function hasUploadField(fields: FieldConfig[]): boolean {
	return fields.some(
		(field) => field.kind === 'upload' || (field.kind === 'section' && hasUploadField(field.fields))
	);
}

function findUploadProgressLimit(fields: FieldConfig[]): number | undefined {
	for (const field of fields) {
		if (field.kind === 'upload' && field.progressLimitBytes !== undefined) {
			return field.progressLimitBytes;
		}
		if (field.kind === 'section') {
			const limit = findUploadProgressLimit(field.fields);
			if (limit !== undefined) return limit;
		}
	}
	return undefined;
}

export function useForm<Mutation extends FunctionReference<'mutation' | 'action'>>(
	getOptions: () => UseFormOptions<Mutation>,
	bindings: FormBindings<Mutation>,
	captcha: CaptchaApi
) {
	const options = $derived(getOptions());

	const resolveExtraFields = (
		uploadedFiles: string[],
		retainedFiles: string[],
		uploadFiles: PreviewFile[]
	): MutationValues<Mutation> =>
		options.resolveExtraFields?.({ uploadedFiles, retainedFiles, uploadFiles }) ??
		options.extraFields ??
		{};

	let errors = $state<Record<string, string>>({});
	let uploadProgress = $state<number | null>(null);
	let uploadProgressBytes = $state(0);
	let preparingUpload = $state(false);
	const uploadProgressLimitBytes = $derived(findUploadProgressLimit(options.fields));
	let pendingCaptchaForm: HTMLFormElement | undefined;

	const { function: convexFunction, functionType } = getOptions();
	// SAFETY: functionType and the generated Convex reference are supplied together by Form.
	const callFunction = (
		functionType === 'action'
			? useAction(convexFunction as FunctionReference<'action'>)
			: useMutation(convexFunction as FunctionReference<'mutation'>)
	) as (args: FunctionArgs<Mutation>) => Promise<FunctionReturnType<Mutation>>;

	const generateUploadUrls = useMutation(api.storage.r2.generateUploadUrls);
	const processUploads = useAction(api.storage.actions.processUploads);
	const deleteUpload = useMutation(api.storage.r2.deleteObject);

	const getValue = (name: string) => getFormValue(bindings.values, name);
	const setValue = (name: string, value: FormValue) => {
		// SAFETY: editable values are partial input; the required schema validates them on submit.
		bindings.values = setFormValue(bindings.values, name, value) as MutationValues<Mutation>;
		if (errors[name]) errors[name] = '';
	};

	const inputValue = (name: string) => {
		const value = getValue(name);
		return value == null ? '' : String(value);
	};

	const checkboxValue = (name: string) => getValue(name) === true;

	const fieldContext = $derived<FormFieldContext<FormValue>>({
		get values() {
			return bindings.values;
		},
		get errors() {
			return errors;
		},
		getValue,
		setValue,
		inputValue,
		checkboxValue,
		get disabled() {
			return bindings.submitting;
		}
	});

	const customFieldContext = (field: CustomField): CustomFieldContext => ({
		...fieldContext,
		field,
		error: errors[field.name],
		// SAFETY: custom controls own their value type; the Convex validator remains authoritative.
		setValue: (name, value) => setValue(name, value as FormValue),
		disabled: bindings.submitting
	});

	const removeUploads = async (keys: string[]) => {
		await Promise.allSettled(keys.map((key) => deleteUpload({ key })));
	};

	const uploadSelectedFiles = async () => {
		const uploadFiles = bindings.uploadFiles;
		const files = uploadFiles.flatMap((preview) => (preview.file ? [preview.file] : []));
		uploadProgress = 0;
		uploadProgressBytes = 0;
		if (files.some((file) => file.size === 0 || file.size > STORAGE_CONFIG.maxFileSizeBytes)) {
			throw new ConvexError<BackendErrorData>({ code: 'INVALID_UPLOAD' });
		}
		if (exceedsUploadBatchLimit(files.map((file) => file.size))) {
			throw new ConvexError<BackendErrorData>({
				code: 'UPLOAD_BATCH_TOO_LARGE',
				maxSizeMB: STORAGE_CONFIG.maxTotalUploadBytes / (1024 * 1024)
			});
		}

		const progress = files.map((file) => ({ loaded: 0, total: file.size }));
		const uploads = await generateUploadUrls({
			namespace: options.uploadNamespace || undefined,
			files: files.map((file) => ({ size: file.size, contentType: file.type }))
		});
		const keys = uploads.map((upload) => upload.key);
		try {
			// Wait for every transfer to settle before cleaning up partial success.
			const results = await Promise.allSettled(
				files.map((file, index) =>
					uploadWithProgress(
						uploads[index].url,
						file,
						({ loaded, total }) => {
							progress[index] = { loaded, total };
							uploadProgress = aggregateUploadProgress(progress);
							uploadProgressBytes = progress.reduce((sum, item) => sum + item.loaded, 0);
						},
						options.uploadErrorMessage,
						options.uploadCancelledMessage
					)
				)
			);
			const failed = linearFind(results, (result) => result.status === 'rejected');
			if (failed?.status === 'rejected') throw failed.reason;
			preparingUpload = true;
			return await processUploads({ keys });
		} catch (error) {
			await removeUploads(keys);
			throw error;
		} finally {
			preparingUpload = false;
		}
	};

	async function submit(
		event: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }
	): Promise<void> {
		event.preventDefault();

		if (bindings.submitting) return;

		const captchaAction = options.captchaAction;
		if (captchaAction && options.functionType !== 'action')
			throw new Error('captchaAction requires functionType="action"');

		const form = event.currentTarget;
		pendingCaptchaForm = undefined;
		errors = {};

		let uploadedFiles: string[] = [];
		let retainedFiles: string[] = [];
		let result: FunctionReturnType<Mutation>;
		let captchaUsed = false;

		const uploadEnabled = hasUploadField(options.fields);
		const hasUploadAwareExtraFields = Boolean(options.resolveExtraFields);

		bindings.submitting = true;

		try {
			if (uploadEnabled) {
				retainedFiles = bindings.uploadFiles.flatMap((preview) =>
					preview.key ? [preview.key] : []
				);
			}

			const validate = () =>
				options.schema.safeParseAsync(
					$state.snapshot({
						...bindings.values,
						...resolveExtraFields(uploadedFiles, retainedFiles, bindings.uploadFiles)
					})
				);

			let parsed = await validate();

			if (!parsed.success) {
				errors = formValidationErrors(parsed.error.issues);
				toast.error(m['Components.Form.fixHighlightedFields']());
				return;
			}

			if (captchaAction && !captcha.token) {
				pendingCaptchaForm = form;
				captcha.execute();
				return;
			}

			captchaUsed = Boolean(captchaAction);

			if (uploadEnabled && bindings.uploadFiles.some((preview) => preview.file)) {
				uploadedFiles = await uploadSelectedFiles();
				uploadProgress = null;

				if (hasUploadAwareExtraFields) {
					// Uploaded keys can change resolved extra fields; validate the final payload again.
					parsed = await validate();

					if (!parsed.success) {
						errors = formValidationErrors(parsed.error.issues);
						await removeUploads(uploadedFiles);
						toast.error(m['Components.Form.fixHighlightedFields']());
						return;
					}
				}
			}

			const captchaToken = captcha.token;
			if (captchaAction && !captchaToken) throw new Error(options.errorMessage);

			const mutationArgs = {
				...parsed.data,
				uploadedFiles: uploadedFiles.length ? uploadedFiles : undefined,
				retainedFiles: uploadEnabled ? retainedFiles : undefined,
				turnstileToken: captchaAction ? captchaToken : undefined
			};

			// SAFETY: Zod validates the payload; Form adds transport fields and Convex validates the final args.
			result = await callFunction(mutationArgs as FunctionArgs<Mutation>);
		} catch (error) {
			await removeUploads(uploadedFiles);
			toastMessage({ type: 'error', error, message: options.errorMessage });
			return;
		} finally {
			bindings.submitting = false;
			preparingUpload = false;
			uploadProgress = null;
			uploadProgressBytes = 0;

			if (captchaUsed) captcha.reset();

			if (Object.values(errors).some(Boolean)) {
				await tick();
				focusFirstError(form);
			}
		}

		if (options.resetOnSuccess) {
			form.reset();
			bindings.values = {};
			errors = {};

			for (const file of bindings.uploadFiles) if (file.file) URL.revokeObjectURL(file.url);
			bindings.uploadFiles = [];
		}

		toastMessage({ type: 'success', message: options.successMessage });
		await options.onSuccess?.(result);
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
		get uploadProgressBytes() {
			return uploadProgressBytes;
		},
		get preparingUpload() {
			return preparingUpload;
		},
		get uploadProgressLimitBytes() {
			return uploadProgressLimitBytes;
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
