<script lang="ts">
	// COMPONENTS
	import FormField from './form-field.svelte';
	import UploadFile from '@/features/uploadFile/components/upload-file.svelte';

	// TYPES
	import type { PreviewFile } from '@/features/uploadFile/types/uploadFileTypes.js';
	import type { UploadField } from './formTypes.js';

	type Props = {
		field: UploadField;
		uploadFiles?: PreviewFile[];
		submitting?: boolean;
		/** Submit-time schema error for this upload field; empty until a submit fails. */
		error?: string;
	};

	let {
		field,
		uploadFiles = $bindable<PreviewFile[]>([]),
		submitting = false,
		error
	}: Props = $props();
</script>

<FormField {field} disabled={submitting || field.disabled} {error}>
	<UploadFile
		id={field.name}
		name={field.name}
		accept={field.accept}
		allowMultiple={field.mode === 'multiple'}
		invalid={Boolean(error)}
		bind:files={uploadFiles}
		disabled={submitting || field.disabled}
	/>
</FormField>
