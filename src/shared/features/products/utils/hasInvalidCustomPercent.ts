export function hasInvalidCustomPercent(
	customPercent: string,
	customPercentNumber: number
): boolean {
	return (
		customPercent !== '' &&
		(!Number.isInteger(customPercentNumber) ||
			customPercentNumber < 5 ||
			customPercentNumber > 95 ||
			customPercentNumber % 5 !== 0)
	);
}
