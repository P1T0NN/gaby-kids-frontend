/**
 * Lookup/index helpers for data that is ALREADY in memory.
 *
 * A Map gives O(1) average lookup after an O(n) preprocessing/build step.
 * This is excellent when you will perform many exact-key lookups against the
 * same in-memory collection.
 */

/**
 * Build: O(n) time, O(n) extra space.
 * Lookup afterward with map.get(key): O(1) average.
 *
 * If duplicate keys exist, the LAST item wins.
 *
 * Great for:
 * - productsById
 * - usersById
 * - variantsBySku
 *
 * Bad idea if you fetched an entire database table only to build this Map.
 * Let the database/index narrow the data first.
 */
export function indexBy<T, K>(
  items: readonly T[],
  getKey: (item: T) => K,
): Map<K, T> {
  const result = new Map<K, T>();

  for (const item of items) {
    result.set(getKey(item), item);
  }

  return result;
}

/**
 * Build: O(n) time, O(n) extra space.
 * Lookup afterward: O(1) average.
 *
 * Same as indexBy(), but throws if duplicate keys are found.
 * Useful when uniqueness is an invariant you want to enforce in memory.
 */
export function uniqueIndexBy<T, K>(
  items: readonly T[],
  getKey: (item: T) => K,
): Map<K, T> {
  const result = new Map<K, T>();

  for (const item of items) {
    const key = getKey(item);

    if (result.has(key)) {
      throw new Error(`Duplicate key encountered: ${String(key)}`);
    }

    result.set(key, item);
  }

  return result;
}

/**
 * O(n) time, O(n) extra space.
 * Groups many items under the same key.
 *
 * Great for:
 * - orderItems grouped by orderId
 * - products grouped by categoryId
 * - variants grouped by productId
 */
export function groupBy<T, K>(
  items: readonly T[],
  getKey: (item: T) => K,
): Map<K, T[]> {
  const result = new Map<K, T[]>();

  for (const item of items) {
    const key = getKey(item);
    const group = result.get(key);

    if (group) group.push(item);
    else result.set(key, [item]);
  }

  return result;
}

/**
 * O(n) time, O(k) extra space, where k is the number of distinct keys.
 * Counts how often each key occurs.
 *
 * Great for:
 * - quantity/count summaries
 * - counts per category
 * - orders per customer inside an already-fetched bounded result set
 */
export function countBy<T, K>(
  items: readonly T[],
  getKey: (item: T) => K,
): Map<K, number> {
  const result = new Map<K, number>();

  for (const item of items) {
    const key = getKey(item);
    result.set(key, (result.get(key) ?? 0) + 1);
  }

  return result;
}
