# Coupons System Design

Status: admin management, checkout redemption, Stripe application, per-customer
limits, and the sign-in requirement are implemented.

## Decision

Coupons are percent-off discount codes redeemed at checkout. A coupon is
merchandise-only: it discounts the products subtotal, never the shipping fee,
and the free-shipping threshold still uses the pre-discount subtotal.

The client never sends a discount amount. The public preview query exists only
for instant feedback; `createCheckoutReservation` is the trusted pricing
boundary and recomputes everything from live product variant prices.

Stripe rejects negative line items, so the trusted discount is applied to the
session as a one-off Stripe coupon (`amount_off`, `duration: 'once'`) created in
`createStripeCheckout`. That keeps `session.amount_total` equal to the stored
trusted total, so the existing webhook verification chain stays valid.

100% is intentionally unsupported (`percentOff` is 1–99): a zero-total Checkout
Session takes Stripe's `no_payment_required` path, which this app's paid-webhook
flow does not handle.

## Data model

`coupons` (new table in `src/convex/schema.ts`):

| Field                           | Contract                                                        |
| ------------------------------- | --------------------------------------------------------------- |
| `name`                          | Admin label.                                                    |
| `code`                          | Normalized (trimmed, uppercased), unique via `by_code`.         |
| `percentOff`                    | Integer 1–99, applied to the merchandise subtotal.              |
| `active`                        | Only active coupons resolve.                                    |
| `expiresAt` (optional)          | Milliseconds; the admin date picker stores end of that UTC day. |
| `minSubtotalInCents` (optional) | Minimum merchandise subtotal.                                   |
| `maxRedemptions` (optional)     | Global cap on paid orders; checked against `redemptionCount`.   |
| `onePerCustomer`                | See per-customer checks below.                                  |
| `redemptionCount`               | Incremented in `completeCheckoutReservation` per paid order.    |

`orders` gains the immutable redemption snapshot and the indexes that make the
per-customer check cheap:

- `couponId` (optional), `couponCode` (optional), `discountInCents` (optional).
- `by_coupon_id_and_customer_id` (`couponId`, `customerId`).
- `by_coupon_id_and_email` (`couponId`, `email`).

Orders are only inserted by the verified paid webhook, so an order row is itself
a redemption; there is no separate redemptions table.

## Validation and limits

`getCouponForCheckout` (`src/convex/tables/coupons/helpers`) is the single
resolver used by both `validateCoupon` (preview) and `createCheckoutReservation`
(trusted). It throws typed `ConvexError` codes translated in the UI:

| Condition                                                                                              | Code                         |
| ------------------------------------------------------------------------------------------------------ | ---------------------------- |
| `COUPONS_REQUIRE_SIGN_IN` and caller is a guest                                                        | `COUPON_SIGN_IN_REQUIRED`    |
| No coupon with that normalized code                                                                    | `COUPON_NOT_FOUND`           |
| `active` is false                                                                                      | `COUPON_INACTIVE`            |
| Past `expiresAt`                                                                                       | `COUPON_EXPIRED`             |
| Below `minSubtotalInCents`                                                                             | `COUPON_MIN_SUBTOTAL`        |
| `redemptionCount >= maxRedemptions`                                                                    | `COUPON_USAGE_LIMIT_REACHED` |
| `onePerCustomer` and a prior paid order matches either the account/device id **or** the checkout email | `COUPON_ALREADY_USED`        |

The discount is `round(subtotal * percentOff / 100)`, capped one cent below the
subtotal so the payable total can never reach zero.

Per-customer identity:

- Signed in: `identity.subject` (Better Auth user id).
- Guest: `customerRef`, the anonymous device UUID (`analytics:customerId`).
- Email: `orders.email`, already normalized lowercased by `createOrderSchema`.

Checking both closes the "clear localStorage" bypass; `claimCustomerOrders`
also rewrites prior guest orders to the account subject on sign-in, so the
account check finds them too.

## Checkout and Stripe flow

1. `CheckoutCoupon` (checkout summary) submits the typed code to `validateCoupon`
   with `customerRef`, the live checkout email, and the current subtotal, and
   holds `{ code, percentOff }` in page state.
2. `CheckoutForm` submits `couponCode`; `createCheckoutReservation` resolves the
   coupon, computes `discountInCents`, and stores `couponId`/`couponCode`/
   `discountInCents` in the trusted checkout snapshot. `totalInCents` is
   `subtotal + shipping - discount`.
3. `createStripeCheckout` creates the one-off Stripe coupon and passes
   `discounts: [{ coupon }]`; it deletes the Stripe coupon if session creation
   fails.
4. Metadata carries `couponId`/`couponCode`/`discountInCents` plus the
   discounted total. `readPaidCheckout` parses them and validates line identity
   against **`amount_subtotal`** (Stripe allocates session discounts, so
   `amount_total` is reduced per line).
5. `completeCheckoutReservation` re-validates
   `total === subtotal + shipping - discount`, writes the order snapshot, and
   increments `redemptionCount` once. Webhook replays return early before this,
   so they cannot double-count.
6. Order summaries (`OrderLineItems` consumers) show a `Discount (CODE)` row
   when `discountInCents > 0`. Emails already print the discounted total.

## Admin experience

`/admin/coupons` lists coupons newest-first and its header opens
`AddCouponDialog` (NativeDialog + `Form`). Fields: name, code, percent off,
minimum order value, usage limit, expiry date (shadcn Calendar in a
NativePopover), one-per-customer switch, active switch. Rows show name, code,
percent, status badge (active/disabled/expired), expiry, redemptions, and an
actions popover with enable/disable and delete (confirm dialog).

`saveCoupon`, `setCouponActive`, and `deleteCoupon` are admin mutations with
rate limits and audit-log events. Codes are normalized and unique-checked.
Deleting keeps historical order snapshots intact.

## Configuration

`COUPONS_CONFIG` in `src/shared/features/coupons/config.ts`:

| Flag                      | Effect                                                                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `HAS_COUPONS`             | `false` hides the admin route/sidebar link and the checkout code field.                                                                     |
| `COUPONS_REQUIRE_SIGN_IN` | `true` replaces the checkout code field with a sign-in notice and makes the backend reject guest coupon use with `COUPON_SIGN_IN_REQUIRED`. |

## Porting to another project on this starter

Copy these folders verbatim (they only depend on this starter's infrastructure,
listed below):

- `src/shared/features/coupons/**`
- `src/convex/tables/coupons/**`
- `src/features/coupons/**`
- `src/components/pages/admin/coupons/**`
- `src/routes/admin/coupons/**`
- `src/components/ui/calendar/**` (shadcn-svelte Calendar, used by the expiry
  picker; requires `bits-ui` and `@internationalized/date`)
- `tests/convex/coupons.test.ts`, `tests/stripeReadPaidCheckout.test.ts`

Infrastructure they assume (all already in this starter): Convex custom
builders (`adminQuery`, `adminMutation`), `convex-audit-log`, the rate-limiter,
`listPageArgs`/`pageValidator`/`getPagination`, `BackendErrorData`,
`shared/utils/pricing`, Paraglide translation keys, and the UI primitives
`Form`/`FormField`/`FormSwitch`, `DataTable`, `NativeDialog`, `NativePopover`,
`ConfirmDeleteDialog`, `DestructiveMenuItem`, `Button`, `ButtonLink`, `Input`,
`Badge`, `EmptyData`, `ErrorComponent`, `SvelteHead`.

Then apply these edits by hand (one schema and one app per project):

1. `src/convex/schema.ts`: add the `coupons` table and the `orders` coupon
   fields plus the two indexes.
2. `src/shared/types/types.ts`: add the nine `COUPON_*` error codes.
3. `src/utils/getBackendErrorMessage.ts`: map each code to a message
   (formatting `COUPON_MIN_SUBTOTAL` with `formatPrice`).
4. `messages/en.json`: add `CouponsFeature`, `AdminCouponsPage`, the
   `CheckoutPage.CheckoutSummary` coupon keys, the `BackendMessages` entries,
   and the `Discount (CODE)` keys in the order-summary namespaces.
5. `src/shared/constants/pageEndpoints.ts` + `src/routes/admin/+layout.svelte`:
   add `COUPONS` and the sidebar link.
6. Order/checkout pipeline: `ordersSchemas` (`couponCode`), `orderValidators`,
   `toCustomerOrder`, `fetchCheckoutOrder`, `stripeValidators`
   (`checkoutSnapshot` coupon fields), `hasInvalidCheckoutSnapshot` (discount
   math), `createCheckoutReservation`, `completeCheckoutReservation`,
   `createStripeCheckout`, `readPaidCheckout`.
7. Checkout UI: `checkout/+page.svelte` state, `CheckoutForm` `couponCode`
   extra field, `CheckoutSummary` discount row, `OrderLineItems` discount row
   and its two consumers.
8. Run `npx convex dev --once`, then `bunx --bun oxlint`, `bun run check`, and
   `bun run test:convex`.

Feature files:

```
src/shared/features/coupons/config.ts
src/shared/features/coupons/schemas/couponSchemas.ts
src/shared/features/coupons/types/couponTypes.ts
src/shared/features/coupons/utils/calculateCouponDiscountInCents.ts
src/shared/features/coupons/utils/normalizeCouponCode.ts
src/convex/tables/coupons/helpers/getCouponForCheckout.ts
src/convex/tables/coupons/helpers/getCouponPage.ts
src/convex/tables/coupons/mutations/saveCoupon.ts
src/convex/tables/coupons/mutations/setCouponActive.ts
src/convex/tables/coupons/mutations/deleteCoupon.ts
src/convex/tables/coupons/queries/validateCoupon.ts
src/convex/tables/coupons/queries/fetchCouponsAdmin.ts
src/convex/tables/coupons/validators/couponValidators.ts
src/features/coupons/forms/createCouponFields.ts
src/features/coupons/components/add-coupon-dialog/add-coupon-dialog.svelte
src/features/coupons/components/add-coupon-dialog/add-coupon-dialog-form.svelte
src/features/coupons/components/add-coupon-dialog/add-coupon-dialog-expiry-field.svelte
src/features/coupons/components/checkout-coupon/checkout-coupon.svelte
src/components/pages/admin/coupons/admin-coupons-header.svelte
src/components/pages/admin/coupons/admin-coupons-table-item/admin-coupons-table-item.svelte
src/components/pages/admin/coupons/admin-coupons-table-item/admin-coupons-table-item-status-button.svelte
src/components/pages/admin/coupons/admin-coupons-table-item/admin-coupons-table-item-delete.svelte
src/components/pages/admin/coupons/loading/admin-coupons-table-loading.svelte
src/routes/admin/coupons/+page.svelte
src/routes/admin/coupons/+page.ts
```

Coupons intentionally do not need: a redemptions table, an aggregate/trigger, a
cron, or a Stripe product/price sync. The one-off Stripe coupon per discounted
session is deliberate and its failure path deletes the coupon.
