/**
 * Compare text: Unicode NFC, trimmed, internal whitespace collapsed, lowercased.
 * Display casing is preserved separately wherever it is shown to users.
 */
export function normalizeProductOptionText(value: string): string {
	return value.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();
}
