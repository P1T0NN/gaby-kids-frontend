// LIBRARIES
import { useQuery, type UseQueryOptions } from 'convex-svelte';
import {
	getFunctionName,
	type FunctionArgs,
	type FunctionReference,
	type FunctionReturnType
} from 'convex/server';
import { convexToJson, type Value } from 'convex/values';
import { convexQueryCache } from '@/lib/clientCache/clientCache.js';

type QueryArgs<Query extends FunctionReference<'query'>> =
	() => FunctionArgs<Query> | 'skip';

type CachedConvexQueryReturn<Query extends FunctionReference<'query'>> = {
	readonly data: FunctionReturnType<Query> | undefined;
	readonly error: Error | undefined;
	readonly isLoading: boolean;
	readonly isStale: boolean;
};

/** Show the last successful snapshot while a remounted Convex query reconnects. */
export function useCachedConvexQuery<Query extends FunctionReference<'query'>>(
	query: Query,
	args: QueryArgs<Query>,
	options: UseQueryOptions<Query> | (() => UseQueryOptions<Query>) = {}
): CachedConvexQueryReturn<Query> {
	const functionName = getFunctionName(query);
	const queryArgs = $derived(args());
	const cacheKey = $derived.by(() => {
		if (queryArgs === 'skip') return undefined;

		// SAFETY: Convex validates query arguments as serializable Convex values.
		const serializedArgs = convexToJson(queryArgs as Value);
		return `query:${JSON.stringify([functionName, serializedArgs])}`;
	});

	const result = useQuery(query, () => queryArgs, options);
	const freshData = $derived(result.data);
	const cachedData = $derived.by(() => {
		if (cacheKey === undefined) return undefined;

		// SAFETY: A function name and its canonical Convex arguments identify its return type.
		return convexQueryCache.get(cacheKey) as FunctionReturnType<Query> | undefined;
	});

	// Deliberate effect: this synchronizes fresh query results to an external LRU cache;
	// it does not derive Svelte state, and useQuery has no success callback for this write.
	$effect(() => {
		const canCacheFreshData =
			cacheKey !== undefined && freshData !== undefined && !result.isStale;
		if (canCacheFreshData) {
			convexQueryCache.set(cacheKey, freshData);
		}
	});

	const data = $derived(
		result.error ? undefined : freshData !== undefined ? freshData : cachedData
	);
	const isLoading = $derived(result.isLoading && cachedData === undefined);
	const isStale = $derived(result.isStale || (result.isLoading && cachedData !== undefined));

	return {
		get data() {
			return data;
		},
		get error() {
			return result.error;
		},
		get isLoading() {
			return isLoading;
		},
		get isStale() {
			return isStale;
		}
	};
}
