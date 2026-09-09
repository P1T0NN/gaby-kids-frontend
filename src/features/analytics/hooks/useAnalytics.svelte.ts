// CONFIG
import { ANALYTICS_CONFIG } from '@/shared/features/analytics/config.js';

// TYPES
type AnalyticsArgs = { sessionRef: string };
type AnalyticsMutation<TArgs extends AnalyticsArgs, TResult> = (args: TArgs) => Promise<TResult>;

let fallbackSessionRef: string | undefined;

export function useAnalytics() {
	function getSessionRef(): string {
		try {
			const stored = sessionStorage.getItem(ANALYTICS_CONFIG.sessionStorageKey);
			if (stored) return stored;

			const created = crypto.randomUUID();
			sessionStorage.setItem(ANALYTICS_CONFIG.sessionStorageKey, created);
			return created;
		} catch {
			return (fallbackSessionRef ??= crypto.randomUUID());
		}
	}

	function track<TArgs extends AnalyticsArgs, TResult>(
		mutation: AnalyticsMutation<TArgs, TResult>,
		args: Omit<TArgs, 'sessionRef'>
	): void {
		// SAFETY: replacing the omitted sessionRef reconstructs the mutation's validated argument type.
		void mutation({ ...args, sessionRef: getSessionRef() } as TArgs).catch(() => undefined);
	}

	return { track };
}
