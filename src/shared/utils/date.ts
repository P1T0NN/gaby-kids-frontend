export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;

const relativeTimeUnits = [
	['year', 365 * 24 * 60 * 60 * 1000],
	['month', 30 * 24 * 60 * 60 * 1000],
	['week', 7 * 24 * 60 * 60 * 1000],
	['day', 24 * 60 * 60 * 1000],
	['hour', 60 * 60 * 1000],
	['minute', 60 * 1000],
	['second', 1000]
] as const;

export function formatDate(timestamp: number, locale: string): string {
	return new Intl.DateTimeFormat(locale, {
		dateStyle: 'medium',
		timeZone: 'UTC'
	}).format(timestamp);
}

export function formatDateTime(timestamp: number, locale: string): string {
	return new Intl.DateTimeFormat(locale, {
		dateStyle: 'medium',
		timeStyle: 'short',
		timeZone: 'UTC'
	}).format(timestamp);
}

export function formatRelativeTime(timestamp: number, locale: string, now = Date.now()): string {
	const difference = timestamp - now;
	const absoluteDifference = Math.abs(difference);
	const [unit, milliseconds] =
		relativeTimeUnits.find(([, duration]) => absoluteDifference >= duration) ??
		relativeTimeUnits.at(-1)!;

	return new Intl.RelativeTimeFormat(locale, {
		numeric: 'auto',
		style: 'narrow'
	}).format(Math.trunc(difference / milliseconds), unit);
}

export function startOfDay(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function endOfDay(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}
