# Project coding rules and reuse map

Domain map for this ecommerce project: routes, feature pieces, Convex tables and
functions, and the business rules that go with them. Global engineering rules
live in [`CodingRules.md`](./CodingRules.md); read that one first. Longer domain
notes are [`UpsellsSystemDesign.md`](./UpsellsSystemDesign.md) and
[`OrdersSystemDesign.md`](./OrdersSystemDesign.md).

## Routes

- `/` is the public home page.
- `(app)/(unprotected)` contains the shop, product detail, cart checkout,
  sign-in, sign-up, verify-email, forgot-password, and My Orders screens.
- `(app)/(protected)` is reserved for future authenticated storefront pages;
  its server layout owns the authentication redirect.
- `/admin` contains the dashboard, products, categories, orders, upsells,
  users, and audit logs; its server layout owns authentication and admin-role
  redirects.

## Domain feature pieces

| Area                | Existing pieces and intended use                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product variants    | `ProductVariantsEditor` (with option input, variant row, add buttons) edits `ProductVariantFormValue` rows bound from the product forms; `ProductVariantDiscountCalculator` applies bulk discounts; `getProductVariantRowErrors` is the live row validation; `getProductVariantAvailability` and the shared `getProductVariantLabel`/`getProductVariantOptionKey` utilities serve the storefront picker and cart.                                                    |
| Customer links      | `useCustomerLinks` runs once in the root layout: on sign-in it claims the device's anonymous `analytics:customerId` for the account, so guest orders move with the user, and verified-email orders override whichever account holds them. Server side is the `customerLinks` table plus `claimCustomerOrders`.                                                                                                                                                       |
| Analytics dashboard | `createAnalyticsDashboard(client)` creates `AnalyticsDashboardState` (context class in `features/analytics`), which owns the selected range, URL params, previous-range bounds, and both dashboard reads. It loads on mount, on range changes, and on the header's Refresh button with plain `client.query` calls (one-shot, no subscription, no `$effect`); descendants render its state. `dailySales` is the only data source, kept current by the orders trigger. |

## Convex data model

`src/convex/schema.ts` owns these app tables:

- `categories`: flat storefront taxonomy referenced by required
  `products.categoryId`.
- `products`: catalog name, slug, description, one category, an image library
  (`imageKeys`/`images`; covers for listings, upsells, and OG tags use its first
  image), status, `productVariantOptionNames`, and display caches
  (`priceInCents` is the lowest product variant price, `hasPriceRange`, and a
  shared `compareAtPriceInCents` when every product variant matches).
  `saveProduct` creates or edits product details, product variants, and the
  display caches in one transaction; new products default to draft and always
  have at least one product variant. Publishing requires an active category.
  `ageGroup` (`kids`/`adults`) and `gender` (`unisex`/`male`/`female`) are the
  optional indexed storefront facets: filterable alone or combined, where one
  facet uses its index and the rest are post-filtered in the bounded scan.
  `PRODUCTS_CONFIG.HAS_AGE_GROUP` / `HAS_GENDER` hide them from the admin form
  and shop filters; the optional columns always exist.
- `productVariants`: `productId`, `position`, structured `options`
  (`name`/`value`), a catalog-unique `sku`, an ordered `imageKeys` assignment
  from the product library (first = primary, rejected if it references a key
  outside the library), `priceInCents`, `compareAtPriceInCents`, `inventory`,
  and `reservedInventory`. Indexed by `by_product_id` and `by_sku`. Product
  variant rows are the only price and stock source; backend code for them lives
  under `src/convex/tables/productVariants`. The storefront gallery, cart line
  images, and checkout snapshots use the selected variant's images with the
  product library as fallback. One product's variants are always read with
  async iteration through `by_product_id` (never `.collect()`), and deleting a
  product queues bounded scheduled batches for its variants.
- Upsells use an optional, ordered `products.upsellProductIds` array (maximum
  four). `/admin/upsells` manages recommendations through `tables/upsells` admin
  queries and `saveProductUpsells`; the public query returns only active
  recommendations for active source products. Shared config and validation live
  in `src/shared/features/upsells`. Saving updates only recommendations and logs
  the admin action, without sending email.
- `orders` stores customer, fulfillment, trusted totals, payment/fulfillment
  state, and guest receipt access; `orderItems` stores immutable product name,
  product variant label, SKU, price, and quantity snapshots. Never render order
  history from live catalog joins or cascade-delete orders/items with products.
  Stripe Checkout payment state comes only from verified webhook events.
  Delivery orders add `ORDER_CONFIG.shippingFeeInCents` to the merchandise
  subtotal unless it reaches `ORDER_CONFIG.freeShippingThresholdInCents`; pickup
  is always free. The fee is stored as `shippingInCents` and charged as a tagged
  Stripe line item, so the verified session total still equals the order total.
  The storefront nudge (`FreeShippingNudge`) shows the exact remaining amount in
  the cart and the checkout summary.
- `dailySales` is the dashboard's per-store-day rollup
  (`COMPANY_DATA.TIMEZONE`, four order-id shards per day) holding order counts
  by status and paid revenue. Revenue is booked on the store day the order was
  paid. The orders trigger keeps it current on insert, refund, and cancel, so
  dashboard reads never scan orders.
- `customerLinks` maps an anonymous device id (`analytics:customerId`) to the
  account it belongs to. `claimCustomerOrders` runs on sign-in: it writes that
  link, moves the local id's orders to the account, and also moves orders placed
  with the account's verified email — even ones another account currently holds.
  A local id binds to one account only, so a leaked id cannot claim another
  account's orders. Orders placed while signed out keep the local id as their
  `customerId` until claimed. The `customerEmailClaims` marker records when an
  order write made an email's scan stale, so the email pass only reruns when
  there is something new, and a device transfer of an order addressed to a
  different email marks that email pending again for its real owner.
- `storageUploads`: owner, object key, `pending`/`uploaded` status, timestamp,
  and key/created-at indexes. It tracks uploads until a mutation claims them.
- Better Auth owns its component tables (`user`, `session`, `account`,
  `verification`, rate-limit/JWKS tables) under `betterAuth/component`.

## App-facing functions

Current app-facing functions are:

- `api.auth.getCurrentUser`;
- public product listing/detail queries;
- `api.analytics.queries.fetchDashboard` (current vs previous period stats) and
  `api.analytics.queries.fetchRevenueSeries` (zero-filled daily revenue) read the
  `dailySales` rollup for the admin dashboard;
- admin product listing/detail, product saving, and deletion restricted to drafts;
- `api.storage.r2.generateUploadUrl`, `syncMetadata`, and `deleteObject`;
- `api.search.queries.fetchSearchSuggestions` (public, normalized, minimum two
  characters, max seven results);
- admin users/profile/settings/sessions/logs queries and
  `api.auditLogs.queries.fetchAuditLogsAdmin`;
- `api.tables.customerLinks.mutations.claimCustomerOrders` binds the device's
  anonymous customer id to the signed-in account and transfers its orders, plus
  orders matching the account's verified email (idempotent, one account per
  local id); the client calls it on sign-in;
- Checkout opens Stripe through `api.stripe.actions.createStripeCheckout`.
  Its internal preparation query validates active products and product variant
  prices without writing an order or draft. Stripe stores customer metadata and
  immutable line prices; only the verified paid webhook calls the internal
  `completeCheckoutReservation` mutation. Session and Payment Intent indexes
  prevent duplicate orders from webhook retries.
  Each submission creates a fresh Stripe Session, without checkout retry tracking.
  The receipt uses a server-generated random `receiptToken` solely as a guest
  access token. Mounting a paid receipt saves guest access; the first return from
  Stripe clears the current cart. No pre-payment cart snapshot is stored.

## Domain rules

- Operation input schemas use the exact function name plus `Schema`, such as
  `saveProductSchema` and `updateCategorySchema`; reusable data schemas keep
  descriptive names such as `productVariantSetSchema`. Admin user filters use
  `ADMIN_USERS_FILTER_DEFS`, My Orders uses `MY_ORDERS_FILTER_DEFS`, and both
  feed `useFilters`.
- `$effect` remains deliberately only in `useCachedConvexQuery.svelte.ts`,
  `useConvexPagination.svelte.ts`, and the My Orders page, and only for external
  synchronization without a `useQuery` success callback.
- The add and edit forms save content/category/images/product variants through
  `saveProduct`. Catalog edits use last-save-wins. Product variant prices and
  stock are stored as integer cents and units on `productVariants`; the
  product-level price fields are display caches only. Cart lines are keyed by
  `productVariantId`; `api.tables.productVariants.queries.fetchCart` resolves
  live product variant prices and availability for the cart and checkout
  summary. Storefront listings read one bounded product-variant summary per page
  item for availability and use the denormalized price cache for prices.
- `COMPANY_DATA.TIMEZONE` is the store's IANA zone. Dashboard day boundaries,
  `dailySales` buckets, and chart labels all use it (`getStoreDayKey` /
  `getStoreDayStart` in `src/shared/utils/date.ts`), never the viewer's browser
  zone. Refunding an order restates the store day it was paid on, not the refund
  day.
- Guest identity: `analytics:customerId` is the anonymous device UUID; it is
  never overwritten by the signed-in user id, and signed-in attribution is
  always derived from the session. Checkout requires a `customerRef` (that
  device UUID) and stores it as the order's `customerId` for guests; signed-in
  orders use `identity.subject`. `claimCustomerOrders` reconciles both on
  sign-in, and user deletion clears the account's links and email marker.
