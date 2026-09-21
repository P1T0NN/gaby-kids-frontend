/**
 * DEVELOPMENT / LEARNING helpers for comparing Big-O growth.
 *
 * These functions estimate abstract "work units". They do NOT predict actual
 * milliseconds because real performance also depends on constants, I/O,
 * memory locality, network latency, database implementation, etc.
 */

export type CommonComplexity =
  | "O(1)"
  | "O(log n)"
  | "O(n)"
  | "O(n log n)"
  | "O(n^2)"
  | "O(n^3)"
  | "O(2^n)";

/**
 * Estimate relative work for one operation over input size `n`.
 */
export function estimateWork(
  n: number,
  complexity: CommonComplexity,
): number {
  if (!Number.isFinite(n) || n < 0) {
    throw new RangeError("n must be a finite non-negative number");
  }

  // log2(0) is undefined; an empty/single-element input is effectively constant.
  const logN = n <= 1 ? 1 : Math.log2(n);

  switch (complexity) {
    case "O(1)":
      return 1;
    case "O(log n)":
      return logN;
    case "O(n)":
      return n;
    case "O(n log n)":
      return n * logN;
    case "O(n^2)":
      return n ** 2;
    case "O(n^3)":
      return n ** 3;
    case "O(2^n)":
      return 2 ** n;
  }
}

/**
 * Estimate repeated work:
 *
 *     total work ≈ number of operations × f(n)
 *
 * Example:
 * estimateRepeatedWork(1_000_000, 1_000, "O(n)")
 * -> roughly 1,000,000,000 abstract work units.
 */
export function estimateRepeatedWork(
  n: number,
  operations: number,
  complexity: CommonComplexity,
): number {
  if (!Number.isFinite(operations) || operations < 0) {
    throw new RangeError("operations must be a finite non-negative number");
  }

  return operations * estimateWork(n, complexity);
}

/**
 * Compare several complexity classes at the same input size/frequency.
 * Useful for reasoning and profiling discussions, not as an automatic runtime
 * algorithm selector.
 */
export function compareComplexities(
  n: number,
  operations = 1,
  complexities: readonly CommonComplexity[] = [
    "O(1)",
    "O(log n)",
    "O(n)",
    "O(n log n)",
    "O(n^2)",
  ],
): Array<{ complexity: CommonComplexity; estimatedWork: number }> {
  return complexities.map((complexity) => ({
    complexity,
    estimatedWork: estimateRepeatedWork(n, operations, complexity),
  }));
}
