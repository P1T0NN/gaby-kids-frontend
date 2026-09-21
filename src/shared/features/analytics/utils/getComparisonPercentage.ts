export function getComparisonPercentage(current: number, previous: number): number | undefined {
	return previous > 0 ? ((current - previous) / previous) * 100 : undefined;
}
