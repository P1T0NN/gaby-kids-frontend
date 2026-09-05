// LIBRARIES
import { type ReturnValueForOptionalValidator } from 'convex/server';
import { v, type GenericValidator, type ObjectType, type PropertyValidators } from 'convex/values';
import { query as rawQuery, type QueryCtx } from '../_generated/server.js';

// CONFIG
import { SEARCH_DROPDOWN_LIMIT, SEARCH_MIN_CHARS } from '../../shared/features/search/config.js';

const searchQueryArgs = {
	search: v.string()
};

type CombinedArgsValidator<SpecificArgsValidator extends PropertyValidators> =
	typeof searchQueryArgs & SpecificArgsValidator;

type SearchQueryArgs<SpecificArgsValidator extends PropertyValidators> =
	ObjectType<SpecificArgsValidator> & { search: string };

type RequiredValidator = GenericValidator & { isOptional: 'required' };
type EmptyArgsValidator = Record<never, GenericValidator>;

type FetchOptimizedSearchQueryOptions<
	ArgsValidator extends PropertyValidators,
	ReturnsValidator extends RequiredValidator,
	T
> = {
	args?: ArgsValidator;
	returns: ReturnsValidator;
	fetchResults: (args: {
		ctx: QueryCtx;
		search: string;
		limit: number;
		args: SearchQueryArgs<ArgsValidator>;
	}) => T[] | Promise<T[]>;
};

/** Register a public Convex search query with normalized, bounded suggestions. */
export function fetchOptimizedSearchQuery<
	ArgsValidator extends PropertyValidators = EmptyArgsValidator,
	ReturnsValidator extends RequiredValidator = RequiredValidator,
	T = unknown
>(options: FetchOptimizedSearchQueryOptions<ArgsValidator, ReturnsValidator, T>) {
	// SAFETY: The wrapper owns these validated arguments and merges the search validator.
	const args = {
		...options.args,
		...searchQueryArgs
	} as CombinedArgsValidator<ArgsValidator>;

	const run = async (ctx: QueryCtx, queryArgs: SearchQueryArgs<ArgsValidator>) => {
		const search = queryArgs.search.trim().toLowerCase();
		if (search.length < SEARCH_MIN_CHARS) {
			// SAFETY: Search queries are configured with an array return validator; an empty result is valid.
			return [] as ReturnValueForOptionalValidator<ReturnsValidator>;
		}

		const results = await options.fetchResults({
			ctx,
			search,
			limit: SEARCH_DROPDOWN_LIMIT,
			args: queryArgs
		});

		// SAFETY: The configured returns validator validates this result at runtime.
		return results.slice(
			0,
			SEARCH_DROPDOWN_LIMIT
		) as ReturnValueForOptionalValidator<ReturnsValidator>;
	};

	return rawQuery<
		CombinedArgsValidator<ArgsValidator>,
		ReturnsValidator,
		ReturnValueForOptionalValidator<ReturnsValidator>,
		[args: ObjectType<CombinedArgsValidator<ArgsValidator>>]
	>({
		args,
		returns: options.returns,
		handler: (ctx, handlerArgs) => {
			// SAFETY: Convex validates the merged validators before the handler runs.
			const queryArgs = handlerArgs as SearchQueryArgs<ArgsValidator>;
			// SAFETY: `run` returns the value validated by the configured return validator.
			return run(ctx, queryArgs) as ReturnValueForOptionalValidator<ReturnsValidator>;
		}
	});
}
