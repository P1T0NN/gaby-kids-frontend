/**
 * Search algorithms for data that is ALREADY in memory.
 *
 * IMPORTANT:
 * Do not fetch an entire database table just so you can use these functions.
 * For database data, narrow the result set with the database/index first,
 * then use these helpers on the returned array when needed.
 */

/**
 * O(n) time, O(1) extra space.
 *
 * Use when:
 * - The array is small.
 * - The data is not sorted.
 * - You only need one matching item.
 *
 * Avoid when:
 * - You repeatedly search a large array by the same key. Build a Map instead.
 * - The data lives in the database. Query/index it there first.
 */
export function linearFind<T>(
  items: readonly T[],
  predicate: (item: T, index: number) => boolean,
): T | undefined {
  for (let i = 0; i < items.length; i += 1) {
    if (predicate(items[i], i)) return items[i];
  }

  return undefined;
}

/**
 * O(n) time, O(1) extra space.
 * Same idea as linearFind(), but returns the matching index.
 */
export function linearFindIndex<T>(
  items: readonly T[],
  predicate: (item: T, index: number) => boolean,
): number {
  for (let i = 0; i < items.length; i += 1) {
    if (predicate(items[i], i)) return i;
  }

  return -1;
}

import type { Comparator } from "./types";

/**
 * O(log n) search time, O(1) extra space.
 *
 * CRITICAL REQUIREMENT:
 * `items` MUST already be sorted using the exact same ordering as `compare`.
 * Sorting first costs O(n log n), so binary search is most useful when the
 * collection stays sorted and you search it repeatedly.
 *
 * Returns the matching item, or undefined if it does not exist.
 */
export function binarySearch<T>(
  items: readonly T[],
  target: T,
  compare: Comparator<T>,
): T | undefined {
  const index = binarySearchIndex(items, target, compare);
  return index === -1 ? undefined : items[index];
}

/**
 * O(log n) search time, O(1) extra space.
 * Returns the index of a matching item in an already-sorted array.
 */
export function binarySearchIndex<T>(
  items: readonly T[],
  target: T,
  compare: Comparator<T>,
): number {
  let low = 0;
  let high = items.length - 1;

  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    const comparison = compare(items[mid], target);

    if (comparison === 0) return mid;
    if (comparison < 0) low = mid + 1;
    else high = mid - 1;
  }

  return -1;
}

/**
 * O(log n) time, O(1) extra space.
 *
 * Returns the first index where `target` could be inserted while preserving
 * sorted order. Useful for range searches, insertion points, and finding the
 * beginning of duplicate values.
 *
 * `items` MUST already be sorted according to `compare`.
 */
export function lowerBound<T>(
  items: readonly T[],
  target: T,
  compare: Comparator<T>,
): number {
  let low = 0;
  let high = items.length;

  while (low < high) {
    const mid = low + Math.floor((high - low) / 2);

    if (compare(items[mid], target) < 0) low = mid + 1;
    else high = mid;
  }

  return low;
}

/**
 * O(log n) time, O(1) extra space.
 *
 * Returns the first index strictly after `target` in a sorted array.
 * Together with lowerBound(), this can locate the full range of duplicates.
 */
export function upperBound<T>(
  items: readonly T[],
  target: T,
  compare: Comparator<T>,
): number {
  let low = 0;
  let high = items.length;

  while (low < high) {
    const mid = low + Math.floor((high - low) / 2);

    if (compare(items[mid], target) <= 0) low = mid + 1;
    else high = mid;
  }

  return low;
}
