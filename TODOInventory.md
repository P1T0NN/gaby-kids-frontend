# Inventory

## Goal

Implement stock reservations without creating an order before successful Stripe
payment:

`cart -> inventory reservation -> Stripe Checkout (30 minutes) -> paid webhook -> order`

## Implementation chunks

Work on one numbered chunk at a time and stop for code review before continuing.

1. **Inventory foundation and admin management**
   - Status: complete; dev backfill processed all 5 products and required fields are enforced.
   - Add optional `inventory` and `reservedInventory` product fields for a safe rollout.
   - Add explicit `trackInventory`; untracked products are unlimited and skip stock math.
   - Backfill existing products to zero stock, then tighten the fields only after the
     deployed migration is verified.
   - Let admins edit stock on hand, keep reserved stock system-managed, and show stock
     on hand, reserved, and available quantities.
   - Validate stock as a non-negative safe integer and prevent reductions below the
     currently reserved quantity.
2. **Reservation engine, disconnected from Stripe**
   - Status: complete and deployed to development; Stripe integration remains in Chunk 4.
   - Entry points use one file per mutation under
     `src/convex/tables/checkoutReservations/mutations/`.
   - Add the reservation table, indexes, atomic reserve/session-association/release
     mutations, expiration cleanup, and concurrency/idempotency tests.
3. **Paid reservation conversion, disconnected from Stripe**
   - Status: complete in code/tests; Stripe webhook wiring remains in Chunk 4.
   - Add an internal paid-completion mutation that atomically consumes an active
     reservation, updates product stock, creates the paid order and items, and
     completes the reservation.
   - Test duplicate, competing, unpaid, released, expired, and inconsistent-stock
     events without changing the existing Stripe action/webhook path.
4. **Activate the complete Stripe flow**
   - Status: complete; reservation-backed Checkout and webhook routing are wired.
   - Reserve before creating Checkout, use a 30-minute Session, associate metadata and
     Session IDs, release creation failures, and route paid/failed/expired webhooks.
5. **Storefront and cart behavior**
   - Status: complete; availability is exposed and enforced in the storefront and cart.
   - Expose availability, disable unavailable purchases, cap quantities, handle stale
     carts, and add translated sold-out/temporarily-unavailable messages.
6. **Schema hardening and final verification**
   - Status: complete; inventory fields verified as required, the full lifecycle is
     exercised in tests, and all checks (oxlint, svelte-check, Convex tests,
     `convex dev --once`) pass.
   - Re-verify the required inventory fields, exercise the full lifecycle, and run
     every required check.

For the initial implementation, keep delayed payment methods disabled in Stripe so the
reservation lifecycle remains `active -> completed | released`. Supporting delayed
methods later requires an explicit pending-payment state and cleanup policy.

## Rules

- [x] Do not use Stripe manual capture for this flow.
- [x] Do not create an `orders` or `orderItems` document before successful payment.
- [x] A reservation is an internal temporary hold, not a customer-facing order.
- [x] Start a reservation when the server creates the Stripe Checkout Session, not
      when a product is added to the cart.
- [x] Do not reintroduce `retryKey`, Checkout Session reuse, or a checkout version
      marker. A reservation ID is only used to connect the hold to Stripe events.
- [x] Do not add checkout-abandonment analytics or inventory history unless
      explicitly requested later.

## Product inventory

- [x] Add non-negative integer `inventory` to `products`. It represents physical
      units not yet sold.
- [x] Add system-managed `reservedInventory` to `products`. It represents units
      currently held by active Checkout Sessions.
- [x] Add `trackInventory` so products can explicitly opt out of stock tracking;
      existing products default to tracked during backfill.
- [x] Treat `inventory - reservedInventory` as the quantity available for a new
      checkout.
- [x] Add the fields safely to existing products: optional first, backfill current
      products, then make them required if the deployed data permits it.
- [x] Keep products active when availability reaches zero; show them as sold out
      instead of automatically archiving them.

## Reservation table

- [x] Add one `checkoutReservations` document per Checkout Session hold.
- [x] Store only the minimum technical state:
      reservation status (`active`, `completed`, or `released`), expiration time,
      Stripe Checkout Session ID, and immutable product/quantity/price snapshots.
- [x] Add the indexes needed to find a reservation by Stripe Session ID and to
      release active reservations by expiration.
- [x] Make every reservation transition idempotent:
      `active -> completed` for paid checkout and `active -> released` for an
      expired or failed checkout. Repeated events must be no-ops.

## Checkout flow

- [x] Replace the preparation-only checkout query with one internal reservation
      mutation that, in one Convex transaction:
      - validates active products, quantities, prices, and currency;
      - verifies available inventory for every product;
      - increments each product's `reservedInventory`;
      - creates the reservation;
      - returns the trusted immutable Checkout snapshot.
- [x] Create the Stripe Checkout Session from that trusted snapshot.
- [x] Set the Stripe Checkout Session expiration to the supported minimum of
      30 minutes. See [Stripe limited inventory](https://docs.stripe.com/payments/checkout/managing-limited-inventory).
- [x] Put the reservation ID in Stripe metadata and associate the created Stripe
      Session ID and exact expiration with the reservation.
- [x] If Stripe Session creation fails, release the reservation. The expiration
      cleanup remains the fallback if the process fails before release.
- [x] Do not reserve inventory when merely adding or editing cart items. Cart
      inventory is only an advisory client view; the reservation mutation is the
      authority.

## Successful payment

- [x] Update the existing successful-payment webhook path so one internal Convex
      mutation, in one transaction:
      - validates the signed Stripe event, Session, reservation, totals, currency,
        and line items;
      - verifies the reservation is still active;
      - decrements `products.inventory`;
      - decrements `products.reservedInventory`;
      - creates the paid order and immutable order items;
      - marks the reservation `completed`;
      - sends the existing order-created emails exactly once.
- [x] Keep webhook processing safe for duplicate and out-of-order Stripe events.
- [x] If a reservation is already released when Stripe reports a successful
      payment, handle that exceptional state safely rather than creating an
      incorrect order.

## Failed and expired checkout

- [x] Handle `checkout.session.expired` by atomically decrementing the reserved
      quantity for every reservation item and marking the reservation `released`.
- [x] Release reservations for failed or abandoned Checkout Sessions without
      creating orders or order items.
- [x] Add a scheduled expiration fallback so inventory is eventually released
      even if the expiration webhook is delayed or unavailable.
- [x] Do not implement expired-session recovery or recovery URLs; a customer can
      start a fresh Checkout Session after the hold is released.

## Storefront and cart UI

- [x] Expose current available inventory in the existing product and cart results.
- [x] Disable Add to Cart when available inventory is zero.
- [x] Limit cart quantity controls to available inventory where possible.
- [x] Handle stale carts gracefully when another reservation consumes the last
      available units during browsing.
- [x] Use customer-friendly wording:
      - `Sold out` when physical inventory is gone and nothing is reserved.
      - `Temporarily unavailable — someone is completing checkout` when the
        available quantity is zero because an active reservation holds the stock.
- [x] Prevent checkout when the reservation mutation reports unavailable stock,
      and show a translated, actionable error.

## Admin product management

- [x] Add one simple editable `Stock on hand` integer field to the add-product and
      edit-product forms.
- [x] Reject negative, fractional, or unsafe inventory values.
- [x] Prevent an admin from reducing stock below the quantity currently reserved.
- [x] Show stock on hand, reserved quantity, and available quantity clearly in the
      admin product list or edit screen.
- [x] Keep inventory management as a direct quantity edit for now; do not add an
      inventory movement ledger, purchase orders, or analytics.
- [x] Do not automatically restock an item after a refund; restocking is a manual
      admin decision unless return handling is implemented later.

## Verification

- [x] A product with zero available inventory cannot be added to cart or checked
      out.
- [x] Two concurrent reservations cannot oversell the same product.
- [x] A 30-minute expired Checkout Session releases exactly its held quantities.
- [x] The disconnected paid-completion mutation converts one reservation into
      exactly one paid order and decrements inventory exactly once.
- [x] Duplicate, delayed, failed, and out-of-order webhook events remain safe.
- [x] Stripe Session creation failure does not leave inventory permanently held.
- [x] Run `bun run check`.
- [x] Run the relevant Convex tests.
- [x] Run `bunx --bun oxlint`.
- [x] Run `bunx convex dev --once` after Convex changes.
