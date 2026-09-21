import { getContext, setContext, type Component, type Snippet } from 'svelte';
import type { Tooltip } from 'layerchart';

export const THEMES = { light: '', dark: '.dark' } as const;

export type ChartConfig = {
	[k in string]: {
		label?: string;
		icon?: Component;
	} & (
		| { color?: string; theme?: never }
		| { color?: never; theme: Record<keyof typeof THEMES, string> }
	);
};

export type ExtractSnippetParams<T> = T extends Snippet<[infer P]> ? P : never;

export type TooltipPayload = Tooltip.TooltipSeries;

export type TooltipData = Record<string, string | number | Date | boolean | null | undefined>;

function asString(value: string | number | Date | boolean | null | undefined): string | undefined {
	return value?.constructor === String ? String(value) : undefined;
}

// Helper to extract item config from a payload.
export function getPayloadConfigFromPayload(
	config: ChartConfig,
	payload: TooltipPayload,
	key: string,
	data?: TooltipData | null
) {
	const isPayloadKey = payload.key === key || payload.label === key;
	const dataLabel = !isPayloadKey && data ? asString(data[key]) : undefined;
	const configLabelKey = dataLabel ?? key;

	return configLabelKey in config ? config[configLabelKey] : config[key];
}

type ChartContextValue = {
	config: ChartConfig;
};

const chartContextKey = Symbol('chart-context');

export function setChartContext(value: ChartContextValue) {
	return setContext(chartContextKey, value);
}

export function useChart() {
	return getContext<ChartContextValue>(chartContextKey);
}
