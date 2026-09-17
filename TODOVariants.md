# Product Variants

## Goal

Sell one product in several variants (color, size, both, or none), each with its
own SKU, price, and stock:

`cart (productVariantId) -> reservation (product variant stock) -> Stripe -> paid order (product variant snapshot)`

Today price and inventory live on `products`. Both move to variants; the product
keeps only display caches for listings and the shared `trackInventory` switch.

## Decisions

- Structured options, no matrix generation. The product defines
  `productVariantOptionNames` (max 3, e.g. `Color`, `Size`); every product
  variant stores one value per option.
  There is no Shopify-style option registry or auto-generated combination grid.
- Variants own prices and stock. The product-level `priceInCents` becomes a
  denormalized minimum for cards and search, never an input.
- One `trackInventory` switch per product. Stock is always stored per variant;
  when tracking is off the numbers are ignored (same semantics as today).
- SKUs are required per variant, globally unique, and auto-generated from the
  product slug when left blank.
- Labels are derived from option values (`Red / M`). Nothing is stored twice.
- Product images are one upload library on the product; each product variant
  assigns its own ordered subset (`productVariants.imageKeys`, first = primary).
  Listing, upsell, and OG covers still use the library's first image. An
  unassigned variant falls back to the library on the storefront.
- No matrix auto-generation, variant reordering UI, per-variant status,
  barcode/weight/cost fields, or inventory ledger.

## Code layout

- Backend variant code lives under `src/convex/tables/productVariants`
  (`validators/`, `helpers/`).
- Shared variant config and schemas live under
  `src/shared/features/productVariants` (`config.ts`, `schemas/`).
- Client variant components and hooks live under
  `src/features/productVariants` (`components/`).

## Data model

```ts
productVariants: defineTable({
	productId: v.id('products'),
	position: v.number(),
	options: v.array(v.object({ name: v.string(), value: v.string() })),
	sku: v.string(),
	priceInCents: v.number(),
	compareAtPriceInCents: v.optional(v.number()),
	inventory: v.number(),
	reservedInventory: v.number()
})
	.index('by_product_id', ['productId'])
	.index('by_sku', ['sku']);
```

`products` changes:

- Add `productVariantOptionNames: v.array(v.string())` (max 3, unique
  case-insensitively).
- Add `hasPriceRange: v.boolean()` (true when variant prices differ).
- Keep `trackInventory`.
- Repurpose `priceInCents` as the lowest variant payable price (written only by
  `saveProduct`).
- `compareAtPriceInCents` is stored only when every variant shares the same
  compare-at price; otherwise omitted, so listings never show a misleading
  strike-through.
- `inventory` and `reservedInventory` are removed in Chunk 4 after the checkout
  path stops reading them.

Invariants, enforced in `saveProduct` and the shared schema:

- Every product has at least one product variant. The variant count is not
  capped; the platform transaction and query limits are the only ceiling, and
  reads of one product's variants stay on the `by_product_id` index.
- `productVariantOptionNames.length === 0` requires exactly one product variant
  (`options: []`).
- Each product variant's option names match `productVariantOptionNames` in
  order; values are non-empty and trimmed.
- Option combinations are unique per product (case-insensitive, trimmed).
- SKUs are unique across the catalog (`by_sku`).
- `priceInCents` is an integer >= 1; `compareAtPriceInCents > priceInCents`
  when present; `inventory` is an integer >= 0.
- `inventory >= reservedInventory`; a variant with `reservedInventory > 0`
  cannot be deleted; disabling `trackInventory` requires zero reserved units on
  every variant.

## Implementation chunks

Work on one numbered chunk at a time and stop for code review before continuing.

1. **Data foundation and admin persistence**
   - Status: complete; verified with oxlint, svelte-check, `convex dev --once`,
     and the Convex test suite (6 consecutive green runs).
   - Interim wiring: the current forms still edit the denormalized price and
     stock, and `buildSaveProductArgs` maps them onto one default variant until
     the editor lands in Chunk 2.
   - The catalog is empty, so no backfill or staged fields are needed: the new
     columns ship required on the first deploy.
   - Add the `productVariants` table, indexes, and validators
     (`productVariantInput`, `productVariantResult`), plus
     `products.productVariantOptionNames` and `hasPriceRange`.
   - Rewrite `saveProduct` to accept `productVariantOptionNames` +
     `productVariants`, reconcile rows (match by `_id`, insert new, delete
     removed with the reserved guard), enforce SKU uniqueness, generate blank
     SKUs from the slug, and write the product display caches (`priceInCents`,
     `hasPriceRange`, shared `compareAtPriceInCents`).
   - Until Chunk 3, mirror `products.inventory` and `products.reservedInventory`
     as sums of the product variant rows so the current checkout keeps working.
   - Add error codes (`PRODUCT_VARIANT_SKU_TAKEN`,
     `DUPLICATE_PRODUCT_VARIANT_OPTION`, `DUPLICATE_PRODUCT_VARIANT`,
     `PRODUCT_VARIANT_STOCK_BELOW_RESERVED`,
     `CANNOT_DELETE_RESERVED_PRODUCT_VARIANT`, `INVALID_PRODUCT_VARIANT`) with
     `BackendMessages`,
     `getBackendErrorMessage`, and `validationsData` entries.
   - `deleteProduct` also deletes the product's product variants.
   - Tests: create, update, duplicate SKU, duplicate combination, delete
     reserved product variant, stock-below-reserved, blank SKU generation.

2. **Admin Variants card (visual design)**
   - Status: complete; verified with oxlint, eslint, svelte-check,
     `convex dev --once`, and the Convex test suite.
   - The editor and calculator keep their rows in bindable component state
     (the same pattern as the category selector); `CustomFieldContext.errors`
     surfaces the submitted schema errors on the card.
   - Expose the submitted schema error on `CustomFieldContext` (small
     `useForm.svelte.ts` + `formTypes.ts` addition) so the editor can render
     submit-time errors.
   - Add `ProductVariantsEditor` under `src/features/productVariants/components/`:
     option-name editor (max 3, values preserved on rename), product variant
     rows with one value input per option, SKU (auto-filled), price, discounted
     price, stock, add/remove row, and inline errors (duplicate SKU, price
     required, stock below reserved).
   - Move the discount presets into the card as a bulk action over all product
     variants.
   - `createProductFields` replaces the Pricing and Inventory cards with one
     Product variants section: the `trackInventory` switch plus a
     `productVariantsField` snippet (replaces `discountField`; drops
     `inventoryMin` / `inventoryDisabled`).
   - Update both forms: new products start with one default product variant row;
     the edit form maps stored product variants and `productVariantOptionNames`.
   - `buildSaveProductArgs` maps form values to mutation args and generates
     missing SKUs.

3. **Purchase path**
   - Status: complete; verified with oxlint, eslint, svelte-check,
     `convex dev --once`, and the Convex test suite.
   - Product detail queries return `productVariantOptionNames` + product
     variants; listings keep the denormalized price and `hasPriceRange`
     ("From $X").
   - Add the storefront product variant picker; page owns
     `selectedProductVariantId`, the header price and Add-to-cart follow it;
     single-product-variant products hide the picker and behave exactly as
     today.
   - Upsells: a single-product-variant upsell adds directly; a
     multi-product-variant upsell links to the product page instead of silently
     choosing a product variant.
   - Cart items gain `productVariantId` and merge by it; old stored carts are
     invalidated; `fetchCart` works per product variant and returns the derived
     label, price, and availability.
   - Checkout items become `{ productVariantId, quantity }`;
     `createStripeCheckout` args, `createCheckoutReservation`,
     `releaseCheckoutReservation`, and `completeCheckoutReservation` read and
     patch product variant stock and snapshot `productId`, `productVariantId`,
     label, and SKU.
   - Order items, receipt, admin order detail, and emails render the product
     variant label and SKU.
   - Tests: per-product-variant oversell and concurrency, release, completion,
     cart parsing and merging, product variant pricing.

4. **Cleanup, docs, and final verification**
   - Status: complete.
   - Removed the `products.inventory`/`reservedInventory` mirrors; the admin
     listing reads a bounded product-variant summary per page item instead.
   - The obsolete `backfillProductInventory` migration is deleted, and
     `docs/CodingRules.md` documents the product variant model.
   - Run `bunx --bun oxlint`, `bun run check`, `bunx convex dev --once`, and
     `bun run test:convex`.

## Rules

- [x] Never accept a product variant price or stock from the client; the
      reservation mutation rebuilds the trusted snapshot from the database.
- [x] A product variant with `reservedInventory > 0` cannot be deleted or
      lowered below its reserved quantity.
- [x] New products get one default product variant so a simple product never
      forces product variant management.
- [x] One transaction keeps product caches and product variant rows consistent
      (`saveProduct`); no separate sync mutation.
- [x] Do not store product variant labels; derive them from option values.
- [x] Keep listing prices on the denormalized cache; listings read at most one
      bounded product-variant summary per page item for availability.
- [x] The catalog starts empty; the schema can change in place without
      backfills or fallbacks until real data exists.
- [x] Do not add a product variant option matrix or an inventory ledger in this
      scope.
- [x] Per-product-variant images ship as library assignments, not a second
      upload flow.
