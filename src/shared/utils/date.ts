// LIBRARIES
import {
	getLocalTimeZone,
	parseDate,
	type CalendarDate,
	type DateValue
} from '@internationalized/date';

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

export function toIsoDate(date: DateValue): string {
	return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
}

export function parseIsoDate(value: string | null | undefined): CalendarDate | undefined {
	if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
	try {
		return parseDate(value);
	} catch {
		return undefined;
	}
}

export function daysInRange(start: DateValue, end: DateValue): number {
	const startTime = start.toDate(getLocalTimeZone()).getTime();
	const endTime = end.toDate(getLocalTimeZone()).getTime();
	return Math.round((endTime - startTime) / DAY_MS) + 1;
}

type ZonedParts = {
	year: number;
	month: number;
	day: number;
	hour: number;
	minute: number;
	second: number;
};

function getZonedParts(timestamp: number, timeZone: string): ZonedParts {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone,
		hour12: false,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	}).formatToParts(new Date(timestamp));

	const values: Record<string, number> = {};
	for (const part of parts) {
		if (part.type !== 'literal') values[part.type] = Number(part.value);
	}

	return {
		year: values.year,
		month: values.month,
		day: values.day,
		hour: values.hour % 24,
		minute: values.minute,
		second: values.second
	};
}

function getTimeZoneOffsetMs(timestamp: number, timeZone: string): number {
	const parts = getZonedParts(timestamp, timeZone);
	const asUtc = Date.UTC(
		parts.year,
		parts.month - 1,
		parts.day,
		parts.hour,
		parts.minute,
		parts.second
	);
	return asUtc - timestamp;
}

/**
 * The store calendar day for a timestamp, expressed as the UTC midnight of that date. These keys
 * are exactly 24h apart, so they can be iterated, while still naming the day the store is in.
 */
export function getStoreDayKey(timestamp: number, timeZone: string): number {
	const parts = getZonedParts(timestamp, timeZone);
	return Date.UTC(parts.year, parts.month - 1, parts.day);
}

/** The absolute instant of the store's midnight starting the day that contains `timestamp`. */
export function getStoreDayStart(timestamp: number, timeZone: string): number {
	const key = getStoreDayKey(timestamp, timeZone);
	// The offset must be read at (or near) the resulting instant, so it is applied twice.
	const approximate = key - getTimeZoneOffsetMs(key, timeZone);
	return key - getTimeZoneOffsetMs(approximate, timeZone);
}
