# Product option filters — design

Filter the storefront by the product variant options admins define (Color,
Size, …). Which option names are filterable **and which values each filter
offers are declared statically in config**; there is no runtime value
discovery.

## Goal and semantics

- A product matches when **one of its variants carries every selected value**.
  Color=Red matches a product with any Red variant; Color=Red + Size=L matches
  only when a single variant is Red and L. Red + S does not match a product
  whose Red variant is L.
- Option filters AND with the attribute filters (category, age group, gender).
  A product outside the selected category never matches, even if it has the
  selected option values.
- Search ANDs with every selected filter before pagination. Search and filter
  controls stay visible together; date sorting is hidden during search because
  search results use relevance order.
- Filtered listings show **no total count** (unchanged rule): the count source
  only covers the unfiltered query.
- Pagination is unchanged: one query returns 12 items and a cursor; the next
  page is fetched only when the user presses Next.

Because values are static, a filter always renders even when no product
currently uses one of its values; selecting such a value simply returns no
results. That is the deliberate trade for configuration simplicity.

## No caps

There are no application-level product caps or scan-until-full loops. Search
uses indexed equality filters before a single native paginate call; browsing
uses the existing option range and in-query attribute filters. Convex's native
read and search limits still apply. Never filter or deduplicate a fetched page
to implement a selected filter.

## Why a projection table is required

Convex allows one `.paginate()` per function execution, indexes cannot be
queried for "array contains a value", and `.filter()` has no membership test.
Option names and values are data, so they can never become schema fields.
Therefore "products that have a variant with Color=Red" must be answered by
rows that were prepared at write time: an application-level index table.

## Vocabulary

| Term                 | Meaning                                                                               |
| -------------------- | ------------------------------------------------------------------------------------- |
| Option filter        | A configured filter group such as Color or Size.                                      |
| Option value         | A statically declared value of an option filter, such as Red or L.                    |
| Selection key        | The canonical string built from the selected option values, e.g. `color:red\|size:l`. |
| `productOptionIndex` | Application table, one row per product + selection key (not a Convex index).          |

The word "facet" is intentionally not used.

## Static filter list

Only explicitly configured option names become filters, and each filter offers
exactly the values written in config.

`src/shared/features/productVariants/data/productOptionFilters.ts`:

```ts
export const PRODUCT_OPTION_FILTERS = [
	{
		key: 'color',
		optionName: 'Color',
		label: 'Color',
		values: ['Rojo', 'Azul', 'Verde', 'Negro', 'Blanco']
	},
	{
		key: 'age',
		optionName: 'Talla',
		label: 'Age',
		values: ['3M', '6M', '1', '2', '3', '4', '5', '6', '8', '10']
	}
] as const;
```

- `key` is the URL param and the client/server filter key.
- `optionName` is the option name admins type on product variants.
- `label` is the name shown in the shop; it may differ from `optionName`
  (e.g. admins type `Talla` while the shop shows `Age`).
- `values` are the offered values; each is normalized into the URL value
  (`'Rojo'` → `?color=rojo`) while the written string stays the label.
- Labels are admin data and stay untranslated.
- An empty list disables option filters for the project.
- A stored URL value that is not in `values` is ignored (no filter applied).
- Values outside the list are still indexed on save, so adding a value to the
  config later exposes existing products without re-saving them.

## Normalization

One shared helper, applied to option names and values before any comparison:

- Unicode NFC, trim, collapse internal whitespace, lowercase.

Display text (the config's casing) is preserved separately. Two variants using
`Red` and `red` are the same value.

## Data model

### `productOptionIndex`

| Field              | Notes                                                               |
| ------------------ | ------------------------------------------------------------------- |
| `productId`        | `v.id('products')`                                                  |
| `name`             | Copied product name for full-text search; optional during migration |
| `optionKey`        | Canonical selection key                                             |
| `status`           | Copied from the product so the public range can eq it               |
| `categoryId`       | Copied for the category-filtered range                              |
| `ageGroup`         | Copied for the age group filter                                     |
| `gender`           | Copied for the gender filter                                        |
| `productCreatedAt` | Copied `product._creationTime`, keeps the shop sort order           |

Indexes:

- `search_name` searches `name` and equality-filters `status`, `optionKey`,
  `categoryId`, `ageGroup`, and `gender` before pagination.
- `by_product_id` — rebuild/cleanup per product.
- `by_status_and_option_key_and_product_created_at` — selection only.
- `by_status_and_category_id_and_option_key_and_product_created_at` — selection
  - category; avoids scanning a large selection range for a rare category.

## Selection key format and the subset rule

A key is the configured `(name, value)` pairs of one variant, normalized,
sorted by name, joined with `|`, each segment `name:value`:

```text
color:red
color:red|size:l
```

For each variant, write **one `productOptionIndex` row per non-empty subset** of
its configured pairs, deduplicated per product. A Red/L variant produces:

```text
color:red
size:l
color:red|size:l
```

Why subsets: a selection with any number of option filters must map to exactly
one `optionKey` equality, so one paginate can serve it. Single value → single
row; Red + L → combined row. Unrelated pairs never match because the key is
exact. With k configured filters the bound is 2ᵏ−1 rows per variant.

Products without any configured option values get no rows, so they simply never
appear in option-filtered results.

## Write path

`saveProduct` is the only writer of product variants and already runs in one
transaction. After the variant writes it calls one helper,
`createProductOptionIndex`, with the saved product's id, name, status, categoryId,
ageGroup, gender, `_creationTime`, and the incoming variants' option sets. The
helper:

1. computes the new selection keys;
2. reads the product's existing `productOptionIndex` rows via `by_product_id`;
3. deletes the old rows and inserts the new deduplicated keys.

Per product this is a few small writes, independent of catalog size.

`deleteProduct` removes the product's `productOptionIndex` rows in the same
mutation through `removeProductOptionIndex`, alongside the existing variant
cleanup batch.

Inventory-only changes never touch options, so the projection is not churned
by stock updates.

## Read path

`fetchAllProductsPublic` always resolves the selected option values (one value
per filter) into a selection key and applies the attribute filters. Invalid
age-group or gender values return an empty page. Both search paths preserve the
existing final-token prefix search behavior through `getProductSearchTerm`.

- **Selection only** → `getProductOptionPage`:
  - paginate `productOptionIndex` with `by_status_and_option_key_and_product_created_at`
    (or the category composite when a category filter is active), eq `status`
    and `optionKey`, ordered by `productCreatedAt` in the shop's direction;
  - `.filter()` the copied `ageGroup` and `gender` eqs when those filters are
    active;
  - `db.get` the page's products, drop missing ones, map through
    `toProductResult`, then the existing `withProductVariantSummaries`.
- **Search + selection** → `productOptionIndex.search_name`, matching the name
  and all selected attributes plus `optionKey` in the search index. Paginate
  once, then load those products. Selection keys already deduplicate products.
- **Search without selection** → `products.search_name`, with category, age
  group, gender, and public status applied in the search index.
- **No selection, no search** → unchanged existing paths.

`canCountTotal` becomes `!search && !hasAttributeFilters && !optionSelection`,
so filtered pages keep omitting the total.

## UI

- `shopProductFilterDefs.ts` appends one `FilterDef` per configured option
  filter with the configured values as its options and normalized values as
  option ids; the header renders them with the same `NativeSelect` as the other
  filters.
- URL params, `useFilters` identity, pagination reset, and the empty/error
  states are all unchanged.

## Migration

One migration, `backfillProductOptionIndex`, follows the existing
`@convex-dev/migrations` pattern: per product, rebuild its `productOptionIndex`
rows (idempotent; safe to rerun).

For deployments that already have option rows, deploy the optional `name`
field and search index, then run the separate `backfillProductOptionNames`
migration. It patches names in place so existing row IDs and creation times
stay unchanged. Complete this backfill before releasing the combined-search UI:

```sh
bunx convex run migrations/migrations:run '{"fn":"tables/productOptionIndex/migrations/backfillProductOptionIndex:backfillProductOptionNames"}'
bunx convex run --component migrations lib:getStatus
```

Keep the field optional until every deployment has been migrated; new saves
always write it. A fresh deployment with products but no option rows needs
`backfillProductOptionIndex` first.

## Scaling and cost

- **Reads:** one paginated index query plus one `db.get` per item. Non-search
  attribute filters can read extra rows; search filters are indexed.
- **Writes:** bounded per product save/delete; stock changes cost nothing.
- **Storage:** one row per product per subset of its actual variant pairs.
- **Accepted trade-offs:** no filtered totals; filters always render their
  configured values; age group and gender use the copied in-query filters while
  category gets a dedicated composite index.
- **Not built here:** selecting several values of the same filter (Red OR Blue)
  needs multiple ranges and belongs to a future search-service integration.
  The option index serves exactly one selection key per request.

## File map

Create/existing:

- `src/shared/features/productVariants/data/productOptionFilters.ts`
- `src/shared/features/productVariants/utils/normalizeProductOptionText.ts`
- `src/convex/tables/productOptionIndex/utils/buildProductOptionKeys.ts`
- `src/convex/tables/productOptionIndex/utils/resolveProductOptionSelection.ts`
- `src/convex/tables/productOptionIndex/helpers/createProductOptionIndex.ts`
- `src/convex/tables/productOptionIndex/helpers/removeProductOptionIndex.ts`
- `src/convex/tables/productOptionIndex/helpers/readProductOptionIndexRows.ts`
- `src/convex/tables/productOptionIndex/helpers/getProductOptionPage.ts`
- `src/convex/tables/productOptionIndex/migrations/backfillProductOptionIndex.ts`

Modify:

- `src/convex/schema.ts` (`productOptionIndex`)
- `src/convex/tables/products/mutations/saveProduct.ts` (create call)
- `src/convex/tables/products/mutations/deleteProduct.ts` (remove call)
- `src/convex/tables/products/queries/fetchAllProductsPublic.ts` (branch,
  `canCountTotal`)
- `src/features/filters/data/shopProductFilterDefs.ts`

## Test plan

- Key builder: subsets, dedupe, normalization, ignored unconfigured option
  names.
- Save a product with Red/L and Blue/M variants → index rows correct.
- Public query: `color=red` matches; `color=red&size=l` matches;
  `color=red&size=s` does not; category mismatch excludes; an unconfigured
  value is ignored.
- Pagination with and without search: 25 matches → 12 + 12 + 1, with no gaps or duplicates.
- Total undefined when an option filter is active.
- Search combines with options and attributes, including same-variant checks.
- Renames update search names; migration preserves existing index row IDs.
- Deleting a product removes its index rows.
