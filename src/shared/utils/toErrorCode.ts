/**
 * Map a server/API message string to a stable error code, falling back to `fallback` on unknown input.
 * Codes stay in logic; text lives in the caller's message map.
 */
export function toErrorCode<TCode extends string>(
	message: string,
	map: Record<string, TCode>,
	fallback: TCode
): TCode {
	return map[message] ?? fallback;
}
