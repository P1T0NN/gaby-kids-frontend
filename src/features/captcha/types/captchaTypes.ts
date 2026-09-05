export type CaptchaRenderOptions = {
	sitekey: string;
	action: string;
	appearance: 'execute' | 'interaction-only';
	execution?: 'execute';
	callback: (token: string) => void;
	'expired-callback': () => void;
	'error-callback': () => void;
};

export type CaptchaApi = {
	render: (container: HTMLElement, options: CaptchaRenderOptions) => string;
	execute: (widgetId: string) => void;
	reset: (widgetId: string) => void;
	remove: (widgetId: string) => void;
};

export type CaptchaWindow = Window & { turnstile?: CaptchaApi };

export interface CaptchaFieldProps {
	action?: string;
	executeOnDemand?: boolean;
	onToken: (token: string) => void;
	onReset: (reset: () => void) => void;
	onExecute?: (execute: () => void) => void;
}
