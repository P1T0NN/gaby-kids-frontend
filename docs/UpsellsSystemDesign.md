# Upsells System Design

Status: admin management, product-page recommendations, and post-add recommendations implemented.

## Decision

There is one kind of upsell: one product recommends other ordinary products.
A global storefront setting controls whether products have dedicated pages.
Recommendations are shown after adding the source product to the cart, and also
on its product page when product pages are enabled.

| Global storefront mode | Upsell placement                                         |
| ---------------------- | -------------------------------------------------------- |
| Product pages enabled  | Product-page section and dialog after adding to the cart |
| Product pages disabled | Dialog after adding to the cart                          |

Product-page availability is not stored per product. Do not store an upsell
`type` or `placement`; the storefront derives both placements from the existing
product configuration.

## Product fields

Keep the configuration on the existing `products` document:

```ts
products: defineTable({
	// existing product fields
	upsellProductIds: v.optional(v.array(v.id('products')))
});
```

| Field              | Contract                                                                   |
| ------------------ | -------------------------------------------------------------------------- |
| `upsellProductIds` | Ordered IDs of the products to recommend. An empty array means no upsells. |

Upsells are a small, bounded part of the product configuration, so a separate
table is unnecessary for the current requirements. Allow at most four. The save
mutation validates that the IDs are distinct, refer to active products, and do
not include the source product.

The field is optional for existing products; a missing array means no upsells.

The array order is the storefront display order. `saveProductUpsells` replaces
only this array, using the existing admin mutation builder and audit log.
Ordinary product edits preserve upsells. No emails are sent for this admin action.

A separate relationship table becomes appropriate only if recommendations need
to be unbounded, queried efficiently in reverse, or carry their own metadata such
as scheduling, targeting, discounts, ranking signals, or analytics attribution.

## Storefront experience

`fetchProductUpsells` returns at most four active recommendations with only the
fields needed by the storefront. The product detail query uses the same helper,
so both placements apply identical ordering and visibility rules.

After a successful add-to-cart action, products with configured upsells open a
small recommendation dialog. It confirms the add, shows image, name, price, and
one Add action per recommendation, then offers Keep shopping and View cart.
Adding a recommendation does not open another recommendation dialog.

## Admin experience

Manage upsells at `/admin/upsells`:

1. The searchable list shows only products with configured upsells.
2. Each list item displays the main product and its ordered upsell products from
   the same paginated query result.
3. When none exist, the page shows the standard empty state.
4. **Add Upsell** opens the shared editor without a selected product.
5. **Edit Upsells** opens the same editor with the main product and its active
   upsells selected.

The merchant never chooses an upsell type. They only choose the products and
their order. `ManageUpsellsDialog` accepts an optional product ID through its
`upsellId` prop. Without it the dialog is in add mode; with it the dialog is in
edit mode. Edit data is fetched only when the dialog opens.

## Admin queries

`fetchUpsellsAdmin` is the single live subscription for the admin list. It uses
the shared optimized pagination path, keeps only products whose
`upsellProductIds` array is populated, and resolves their ordered upsell products
in the same query result. List items do not start their own display queries.

Convex cannot index whether an array is empty, so the current `hasUpsells`
predicate is a bounded post-filter rather than an indexed lookup. If catalog
size makes that scan measurable, add a denormalized `hasUpsells` boolean to
`products`, maintain it in `saveProductUpsells`, backfill existing products, and
query an index on that field. This optimization does not require a separate
upsells table.

`fetchUpsellForEdit` is an on-demand admin query for the shared dialog. It loads
the main product and returns only existing active upsell products. Missing,
deleted, draft, or archived recommendations are therefore not carried into the
next save.

## Storefront behavior

The product page uses the existing public `fetchProductBySlug` query. Its detail
response includes `upsells`, resolving at most four `upsellProductIds` in stored
order and excluding missing, inactive, or self-referencing products. Each result
contains only its ID, name, slug, price, and first resolved image. Recommendations
are not resolved recursively, and the shared product mapper/list queries do not
load them. An unavailable source product still returns null.

- Render a compact "Pairs well with" list below the main cart action and before
  the description, in the right column on desktop and the same order on mobile.
  Hide the section when no active recommendations remain.
- Each row links to the recommended product and has its own outline Add button.
  Adding a recommendation confirms the addition without opening the cart drawer;
  adding the main product still opens it.
- The product-pages-disabled dialog remains a future placement. Add its public
  query when implementing that mode; no standalone storefront upsell query is
  needed for the current product page.
- Adding an upsell uses the existing cart action. Its current product price and
  normal checkout rules remain authoritative.

No special upsell product, price, cart line, order line, discount, or analytics
table is needed.

Feature configuration and input validation live in `src/shared/features/upsells`.
The save mutation and admin/public queries live in `src/convex/tables/upsells`.
