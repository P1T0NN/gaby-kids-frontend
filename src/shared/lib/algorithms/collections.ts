/**
 * Common O(n)-style collection operations for arrays already in memory.
 */

/**
 * O(n) average time, O(k) extra space.
 * Keeps the first item for each unique key.
 *
 * Prefer this over nested find/findIndex deduplication, which can become O(n²).
 */
export function uniqueBy<T, K>(
  items: readonly T[],
  getKey: (item: T) => K,
): T[] {
  const seen = new Set<K>();
  const result: T[] = [];

  for (const item of items) {
    const key = getKey(item);
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(item);
  }

  return result;
}

/**
 * O(n) average time, O(k) extra space.
 * Returns the number of distinct keys without creating a deduplicated array.
 */
export function countDistinctBy<T, K>(
  items: readonly T[],
  getKey: (item: T) => K,
): number {
  const seen = new Set<K>();

  for (const item of items) {
    seen.add(getKey(item));
  }

  return seen.size;
}

/**
 * O(n) time, O(n) extra space.
 * Splits items into [matching, nonMatching] in a single pass.
 */
export function partition<T>(
  items: readonly T[],
  predicate: (item: T, index: number) => boolean,
): [matching: T[], nonMatching: T[]] {
  const matching: T[] = [];
  const nonMatching: T[] = [];

  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    (predicate(item, i) ? matching : nonMatching).push(item);
  }

  return [matching, nonMatching];
}

/**
 * O(n + m) average time, O(m) extra space.
 * Returns items from `left` whose key also exists in `right`.
 *
 * Uses a Set instead of a nested loop, avoiding a common O(n*m) pattern.
 */
export function intersectionBy<T, U, K>(
  left: readonly T[],
  right: readonly U[],
  leftKey: (item: T) => K,
  rightKey: (item: U) => K,
): T[] {
  const rightKeys = new Set(right.map(rightKey));
  return left.filter((item) => rightKeys.has(leftKey(item)));
}

/**
 * O(n + m) average time, O(m) extra space.
 * Returns items from `left` whose key does NOT exist in `right`.
 */
export function differenceBy<T, U, K>(
  left: readonly T[],
  right: readonly U[],
  leftKey: (item: T) => K,
  rightKey: (item: U) => K,
): T[] {
  const rightKeys = new Set(right.map(rightKey));
  return left.filter((item) => !rightKeys.has(leftKey(item)));
}

/**
 * O(n) time, O(n) output space.
 * Breaks an array into fixed-size chunks.
 * Useful for batching work, NOT as a replacement for database pagination.
 */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  if (!Number.isInteger(size) || size <= 0) {
    throw new RangeError("chunk size must be a positive integer");
  }

  const result: T[][] = [];

  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }

  return result;
}

/**
 * O(n) time, O(1) extra space (excluding callback work).
 * Sums a numeric value derived from each item.
 */
export function sumBy<T>(
  items: readonly T[],
  getValue: (item: T) => number,
): number {
  let total = 0;

  for (const item of items) {
    total += getValue(item);
  }

  return total;
}
