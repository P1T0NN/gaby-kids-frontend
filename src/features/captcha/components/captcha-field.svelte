<script lang="ts">
	// UTILS
	import { captchaAttachment } from '../utils/captchaAttachment.js';

	// TYPES
	import type { CaptchaFieldProps } from '../types/captchaTypes.js';

	let {
		action = 'auth',
		executeOnDemand = false,
		onToken,
		onReset,
		onExecute
	}: CaptchaFieldProps = $props();
</script>

<div {@attach captchaAttachment({ action, executeOnDemand, onToken, onReset, onExecute })}></div>
