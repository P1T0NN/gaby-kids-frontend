// SVELTEKIT IMPORTS
import { env } from '$env/dynamic/public';

// UTILS
import { getCaptcha } from './getCaptcha.js';

// TYPES
import type { CaptchaFieldProps, CaptchaRenderOptions } from '../types/captchaTypes.js';

export function captchaAttachment({
	action = 'auth',
	executeOnDemand = false,
	onToken,
	onReset,
	onExecute
}: CaptchaFieldProps) {
	return (container: HTMLDivElement) => {
		let widgetId: string | undefined;
		let pollId: ReturnType<typeof setInterval> | undefined;
		let timeoutId: ReturnType<typeof setTimeout> | undefined;
		let disposed = false;
		let renderFailed = false;

		const clearToken = () => onToken('');
		const reset = () => {
			clearToken();
			if (widgetId !== undefined) getCaptcha()?.reset(widgetId);
		};

		onReset(reset);
		onExecute?.(() => {
			if (widgetId !== undefined) getCaptcha()?.execute(widgetId);
		});

		const render = () => {
			const captcha = getCaptcha();
			const siteKey = env.PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? '';
			const hasFinishedRendering = disposed || widgetId !== undefined || renderFailed;
			if (hasFinishedRendering) return true;
			if (!siteKey) {
				console.error('[Captcha] PUBLIC_TURNSTILE_SITE_KEY is missing');
				renderFailed = true;
				return true;
			}
			if (!captcha) return false;

			try {
				const options: CaptchaRenderOptions = {
					sitekey: siteKey,
					action,
					appearance: executeOnDemand ? 'execute' : 'interaction-only',
					callback: onToken,
					'expired-callback': clearToken,
					'error-callback': clearToken
				};
				if (executeOnDemand) options.execution = 'execute';
				widgetId = captcha.render(container, options);
				return true;
			} catch (error) {
				console.error('[Captcha] failed to render widget', error);
				renderFailed = true;
				return true;
			}
		};

		const stopPolling = () => {
			if (pollId !== undefined) clearInterval(pollId);
			if (timeoutId !== undefined) clearTimeout(timeoutId);
			pollId = undefined;
			timeoutId = undefined;
		};

		if (!render()) {
			pollId = setInterval(() => {
				if (render()) stopPolling();
			}, 50);
			timeoutId = setTimeout(stopPolling, 10_000);
		}

		return () => {
			disposed = true;
			stopPolling();
			if (widgetId !== undefined) getCaptcha()?.remove(widgetId);
			clearToken();
		};
	};
}
