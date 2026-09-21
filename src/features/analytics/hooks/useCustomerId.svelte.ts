// LIBRARIES
import { authClient } from '@/features/auth/lib/authClient';

// CONFIG
import { ANALYTICS_CONFIG } from '@/shared/features/analytics/config.js';

// UTILS
import { isUuid } from '@/shared/utils/isUuid.js';

let fallbackCustomerIdLocal: string | undefined;

function readOrCreateId(storage: Storage, key: string): string {
	const stored = storage.getItem(key);
	if (stored && isUuid(stored)) return stored;

	const created = crypto.randomUUID();
	storage.setItem(key, created);
	return created;
}

/**
 * The anonymous device id kept in `analytics:customerId`. It is created on demand and never
 * overwritten by the signed-in user id, so signing out returns to the same anonymous identity.
 */
export function getCustomerIdLocal(): string {
	try {
		return readOrCreateId(localStorage, ANALYTICS_CONFIG.customerIdStorageKey);
	} catch {
		return (fallbackCustomerIdLocal ??= crypto.randomUUID());
	}
}

/**
 * The customer id the app should send: the signed-in Better Auth user id when there is one,
 * otherwise the anonymous device id. Derived at read time, so it follows sign-in/sign-out and
 * ignores hand-edited storage while signed in.
 */
export function useCustomerId() {
	const session = authClient.useSession();

	return {
		get customerId() {
			return session.get().data?.user.id ?? getCustomerIdLocal();
		}
	};
}
