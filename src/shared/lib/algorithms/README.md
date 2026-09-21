# algorithms/

Small TypeScript helpers for **data that is already in memory**.

## The most important rule

Do not fetch an entire database table just to run one of these algorithms.

For a database-backed app, the normal flow is:

1. Ask the database for the smallest useful result set.
2. Use database indexes/search indexes/pagination where appropriate.
3. Return only those documents.
4. Use these utilities for local transformations on that bounded result set.

## Quick choice guide

- Exact lookup from a repeatedly-used in-memory collection: `Map` / `indexBy()` — O(1) average lookup after O(n) build.
- One search through a small unsorted array: `linearFind()` — O(n).
- Repeated search through an already-sorted array: `binarySearch()` — O(log n).
- Remove duplicates: `uniqueBy()` — O(n) average.
- Count distinct keys: `countDistinctBy()` — O(n) average.
- Group items: `groupBy()` — O(n) average.
- Count by key: `countBy()` — O(n) average.
- Sort an in-memory array: `sortCopy()` / `sortBy()` — usually O(n log n).
- Compare theoretical growth: `estimateWork()` / `compareComplexities()`.

## Database boundary

If you need one database row by ID, use the database's direct ID lookup.
If you need rows matching a field/range, use the database's index.
If you need text search, use the database's search index.
If the result can grow large, paginate or limit it.

The algorithms here become useful *after* that database step, for example:

- grouping 30 cart items by seller,
- deduplicating 80 returned variants by SKU,
- sorting 50 already-returned products client-side,
- building a Map for repeated access to 100 items already loaded on a page.

They are not replacements for database indexes.
