export function assertDateRange(range: { from: number; to: number }): void {
	if (!Number.isFinite(range.from) || !Number.isFinite(range.to) || range.from > range.to) {
		throw new Error('Invalid dashboard date range');
	}
}
