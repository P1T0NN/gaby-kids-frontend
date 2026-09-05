// TYPES
import type { CaptchaApi, CaptchaWindow } from '../types/captchaTypes.js';

export function getCaptcha(): CaptchaApi | undefined {
	// SAFETY: This helper is called only by the client-side CAPTCHA attachment.
	return (window as CaptchaWindow).turnstile;
}
