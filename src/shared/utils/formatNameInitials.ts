/**
 * "Ogi Tapu" -> "OT". Single-word names fall back to their first two letters.
 */
export function formatNameInitials(name?: string | null): string {
	const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
	if (words.length === 0) return '?';
	const first = words[0][0];
	const second = words[1]?.[0] ?? words[0][1] ?? '';
	return `${first}${second}`.toUpperCase();
}
