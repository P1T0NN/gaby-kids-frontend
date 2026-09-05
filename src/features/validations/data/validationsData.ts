// LIBRARIES
import { m } from '@/lib/paraglide/messages';

export const FALLBACK = () => m['ValidationMessages.fallback']();

export const MESSAGES: [RegExp, () => string][] = [
	[/expected string, received undefined/, () => m['ValidationMessages.requiredValue']()],
	[/expected .+?, received undefined/, () => m['ValidationMessages.requiredField']()],
	[/Too small/, () => m['ValidationMessages.validValue']()]
];
