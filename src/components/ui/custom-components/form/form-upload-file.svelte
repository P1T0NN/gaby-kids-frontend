<script lang="ts">
	// COMPONENTS
	import FormField from './form-field.svelte';
	import { Progress } from '@/components/ui/progress/index.js';
	import UploadFile from '@/features/uploadFile/components/upload-file.svelte';
	import { Spinner } from '../../spinner/index.js';
	import { m } from '@/lib/paraglide/messages';

	// TYPES
	import type { PreviewFile } from '@/features/uploadFile/types/uploadFileTypes.js';
	import type { UploadField } from './formTypes.js';

	type Props = {
		field: UploadField;
		uploadFiles?: PreviewFile[];
		submitting?: boolean;
		/** Submit-time schema error for this upload field; empty until a submit fails. */
		error?: string;
		uploadProgress?: number | null;
		preparingUpload?: boolean;
	};

	let {
		field,
		uploadFiles = $bindable<PreviewFile[]>([]),
		submitting = false,
		error,
		uploadProgress = null,
		preparingUpload = false
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

	{#if uploadProgress !== null}
		<div class="flex flex-col gap-2" role="status" aria-live="polite">
			<div class="flex items-center justify-between gap-3 text-sm">
				<span class="flex flex-row items-center gap-x-3">
					{#if preparingUpload}
						{m['Components.FormUploadFile.preparingFiles']()}
					{:else}
						<Spinner /> {m['Components.FormUploadFile.uploadingFiles']()}
					{/if}
				</span>

				{#if !preparingUpload}
					<span class="text-muted-foreground tabular-nums">{uploadProgress}%</span>
				{/if}
			</div>

			<Progress
				value={uploadProgress}
				aria-label={m['Components.FormUploadFile.uploadProgress']()}
			/>
		</div>
	{/if}
</FormField>
