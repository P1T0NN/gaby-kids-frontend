// CONFIG
import { ANALYTICS_CONFIG } from '@/shared/features/analytics/config.js';

// HOOKS
import { useCustomerId } from './useCustomerId.svelte.js';

// UTILS
import { isUuid } from '@/shared/utils/isUuid.js';

type AnalyticsArgs = { sessionRef: string; customerRef: string };
type AnalyticsMutation<TArgs extends AnalyticsArgs, TResult> = (args: TArgs) => Promise<TResult>;

let fallbackSessionRef: string | undefined;

function readOrCreateSessionRef(): string {
	const stored = sessionStorage.getItem(ANALYTICS_CONFIG.sessionStorageKey);
	if (stored && isUuid(stored)) return stored;

	const created = crypto.randomUUID();
	sessionStorage.setItem(ANALYTICS_CONFIG.sessionStorageKey, created);
	return created;
}

export function useAnalytics() {
	const customer = useCustomerId();

	function getSessionRef(): string {
		try {
			return readOrCreateSessionRef();
		} catch {
			return (fallbackSessionRef ??= crypto.randomUUID());
		}
	}

	function track<TArgs extends AnalyticsArgs, TResult>(
		mutation: AnalyticsMutation<TArgs, TResult>,
		args: Omit<TArgs, 'sessionRef' | 'customerRef'>
	): void {
		// SAFETY: replacing the omitted refs reconstructs the mutation's validated argument type.
		void mutation({
			...args,
			sessionRef: getSessionRef(),
			customerRef: customer.customerId
		} as TArgs).catch(() => undefined);
	}

	return { track };
}
