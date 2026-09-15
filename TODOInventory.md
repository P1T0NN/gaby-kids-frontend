# Inventory

## Goal

Implement stock reservations without creating an order before successful Stripe
payment:

`cart -> inventory reservation -> Stripe Checkout (30 minutes) -> paid webhook -> order`

## Rules

- [ ] Do not use Stripe manual capture for this flow.
- [ ] Do not create an `orders` or `orderItems` document before successful payment.
- [ ] A reservation is an internal temporary hold, not a customer-facing order.
- [ ] Start a reservation when the server creates the Stripe Checkout Session, not
      when a product is added to the cart.
- [ ] Do not reintroduce `retryKey`, Checkout Session reuse, or a checkout version
      marker. A reservation ID is only used to connect the hold to Stripe events.
- [ ] Do not add checkout-abandonment analytics or inventory history unless
      explicitly requested later.

## Product inventory

- [ ] Add non-negative integer `inventory` to `products`. It represents physical
      units not yet sold.
- [ ] Add system-managed `reservedInventory` to `products`. It represents units
      currently held by active Checkout Sessions.
- [ ] Treat `inventory - reservedInventory` as the quantity available for a new
      checkout.
- [ ] Add the fields safely to existing products: optional first, backfill current
      products, then make them required if the deployed data permits it.
- [ ] Keep products active when availability reaches zero; show them as sold out
      instead of automatically archiving them.

## Reservation table

- [ ] Add one `checkoutReservations` document per Checkout Session hold.
- [ ] Store only the minimum technical state:
      reservation status (`active`, `completed`, or `released`), expiration time,
      Stripe Checkout Session ID, and immutable product/quantity/price snapshots.
- [ ] Add the indexes needed to find a reservation by Stripe Session ID and to
      release active reservations by expiration.
- [ ] Make every reservation transition idempotent:
      `active -> completed` for paid checkout and `active -> released` for an
      expired or failed checkout. Repeated events must be no-ops.

## Checkout flow

- [ ] Replace the preparation-only checkout query with one internal reservation
      mutation that, in one Convex transaction:
      - validates active products, quantities, prices, and currency;
      - verifies available inventory for every product;
      - increments each product's `reservedInventory`;
      - creates the reservation;
      - returns the trusted immutable Checkout snapshot.
- [ ] Create the Stripe Checkout Session from that trusted snapshot.
- [ ] Set the Stripe Checkout Session expiration to the supported minimum of
      30 minutes. See [Stripe limited inventory](https://docs.stripe.com/payments/checkout/managing-limited-inventory).
- [ ] Put the reservation ID in Stripe metadata and associate the created Stripe
      Session ID and exact expiration with the reservation.
- [ ] If Stripe Session creation fails, release the reservation. The expiration
      cleanup remains the fallback if the process fails before release.
- [ ] Do not reserve inventory when merely adding or editing cart items. Cart
      inventory is only an advisory client view; the reservation mutation is the
      authority.

## Successful payment

- [ ] Update the existing successful-payment webhook path so one internal Convex
      mutation, in one transaction:
      - validates the signed Stripe event, Session, reservation, totals, currency,
        and line items;
      - verifies the reservation is still active;
      - decrements `products.inventory`;
      - decrements `products.reservedInventory`;
      - creates the paid order and immutable order items;
      - marks the reservation `completed`;
      - sends the existing order-created emails exactly once.
- [ ] Keep webhook processing safe for duplicate and out-of-order Stripe events.
- [ ] If a reservation is already released when Stripe reports a successful
      payment, handle that exceptional state safely rather than creating an
      incorrect order.

## Failed and expired checkout

- [ ] Handle `checkout.session.expired` by atomically decrementing the reserved
      quantity for every reservation item and marking the reservation `released`.
- [ ] Release reservations for failed or abandoned Checkout Sessions without
      creating orders or order items.
- [ ] Add a scheduled expiration fallback so inventory is eventually released
      even if the expiration webhook is delayed or unavailable.
- [ ] Do not implement expired-session recovery or recovery URLs; a customer can
      start a fresh Checkout Session after the hold is released.

## Storefront and cart UI

- [ ] Expose current available inventory in the existing product and cart results.
- [ ] Disable Add to Cart when available inventory is zero.
- [ ] Limit cart quantity controls to available inventory where possible.
- [ ] Handle stale carts gracefully when another reservation consumes the last
      available units during browsing.
- [ ] Use customer-friendly wording:
      - `Sold out` when physical inventory is gone and nothing is reserved.
      - `Temporarily unavailable — someone is completing checkout` when the
        available quantity is zero because an active reservation holds the stock.
- [ ] Prevent checkout when the reservation mutation reports unavailable stock,
      and show a translated, actionable error.

## Admin product management

- [ ] Add one simple editable `Stock on hand` integer field to the add-product and
      edit-product forms.
- [ ] Reject negative, fractional, or unsafe inventory values.
- [ ] Prevent an admin from reducing stock below the quantity currently reserved.
- [ ] Show stock on hand, reserved quantity, and available quantity clearly in the
      admin product list or edit screen.
- [ ] Keep inventory management as a direct quantity edit for now; do not add an
      inventory movement ledger, purchase orders, or analytics.
- [ ] Do not automatically restock an item after a refund; restocking is a manual
      admin decision unless return handling is implemented later.

## Verification

- [ ] A product with zero available inventory cannot be added to cart or checked
      out.
- [ ] Two concurrent reservations cannot oversell the same product.
- [ ] A 30-minute expired Checkout Session releases exactly its held quantities.
- [ ] A successful payment converts one reservation into exactly one paid order
      and decrements inventory exactly once.
- [ ] Duplicate, delayed, failed, and out-of-order webhook events remain safe.
- [ ] Stripe Session creation failure does not leave inventory permanently held.
- [ ] Run `bun run check`.
- [ ] Run the relevant Convex tests.
- [ ] Run `bunx --bun oxlint`.
- [ ] Run `bunx convex dev --once` after Convex changes.
