// TYPES
import type { Cursor, PaginationOptions, PaginationResult } from 'convex/server';

type ConvexCursor = Cursor;

export type GetPaginationOptions = {
	cursor?: ConvexCursor | null;
	pageSize?: number;
	paginationOpts?: PaginationOptions;
};

export type ConvexPaginatedPage<T> = {
	items: T[];
	nextCursor: ConvexCursor | null;
	hasNextPage: boolean;
	pageSize: number;
	total?: number;
};

export type ConvexPaginatedSource<T> = {
	paginate(options: PaginationOptions): Promise<PaginationResult<T>>;
};
