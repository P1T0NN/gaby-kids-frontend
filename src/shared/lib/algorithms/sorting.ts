/**
 * Sorting helpers for data already in memory.
 *
 * JavaScript's Array#sort is implementation-optimized. These helpers mainly
 * provide a clean immutable API and make the expected O(n log n) behavior
 * explicit for normal comparison sorting.
 */

import type { Comparator } from "./types";

/**
 * O(n log n) typical comparison-sort time, O(n) copy space here.
 * Returns a sorted COPY and does not mutate the original array.
 */
export function sortCopy<T>(
  items: readonly T[],
  compare: Comparator<T>,
): T[] {
  return [...items].sort(compare);
}

/**
 * O(n log n) typical time, O(n) copy space here.
 * Sorts by a derived key.
 *
 * Example:
 * sortBy(products, p => p.price, (a, b) => a - b)
 */
export function sortBy<T, K>(
  items: readonly T[],
  getKey: (item: T) => K,
  compareKeys: Comparator<K>,
): T[] {
  return [...items].sort((a, b) => compareKeys(getKey(a), getKey(b)));
}

/**
 * O(n log n) typical time because it sorts the full input.
 * Returns at most `count` highest-ranked items.
 *
 * Fine for small/bounded in-memory arrays. For very large data sets, ask the
 * database to order + take N instead of fetching everything and sorting here.
 */
export function topN<T>(
  items: readonly T[],
  count: number,
  compare: Comparator<T>,
): T[] {
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError("count must be a non-negative integer");
  }

  return [...items].sort(compare).slice(0, count);
}
