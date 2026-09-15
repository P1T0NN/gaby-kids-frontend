# TODO

## Complete the Stripe checkout payment slice

The universal Stripe client and verified `/stripe/webhook` endpoint are already set up. The next goal is:

`cart -> pending order -> Stripe-hosted Checkout -> webhook-verified paid order`

### 1. Extend orders

- [x] Add optional `stripeCheckoutSessionId`.
- [x] Add optional `stripePaymentIntentId`.
- [x] Add optional `checkoutStatus`.
- [x] Add optional `paidAt`.
- [x] Add optional `refundedAt`.
- [x] Add optional `refundedAmountInCents`.
- [x] Update the related validators and return types.
- [x] Add only the indexes required by actual checkout or webhook lookups (none yet; both paths use the order ID).

Keep these fields optional so existing orders remain valid without a backfill.

### 2. Create a Stripe Checkout Session

- [x] Add a server-side Convex action that loads the existing pending order and its immutable item snapshots.
- [x] Reject orders that cannot be paid, such as already-paid or cancelled orders.
- [x] Build Stripe line items exclusively from trusted stored prices, quantities, currency, and product data. Never accept prices from the browser.
- [x] Create a hosted Stripe Checkout Session in `payment` mode.
- [x] Put the Convex order ID in Stripe metadata.
- [x] Use a stable idempotency key so retries cannot create duplicate Checkout Sessions.
- [x] Persist the Checkout Session ID on the order through an internal mutation.
- [x] Return only the Stripe Checkout URL needed by the client.

### 3. Connect the checkout UI

- [x] Make checkout submission create or reuse the pending order.
- [x] Call the Checkout Session action and redirect to its returned URL.
- [x] Prevent accidental double submission and show a useful error if session creation fails.
- [x] Treat the success URL as presentation only; returning from Stripe must never mark an order as paid.

### 4. Apply verified webhook events

- [x] Dispatch verified events from the existing webhook route to an internal mutation.
- [x] Handle `checkout.session.completed`, marking the order paid only when Stripe reports a paid payment status.
- [x] Handle `checkout.session.async_payment_succeeded`.
- [x] Handle `checkout.session.async_payment_failed`.
- [x] Validate the environment, order metadata, Checkout Session ID, currency, and total before updating an order.
- [x] Store the Payment Intent ID and `paidAt` exactly once.
- [x] Make processing idempotent and safe when Stripe retries or delivers events out of order.
- [x] Return success only after the event has been processed or durably scheduled; return an error when Stripe should retry.

### 5. Verify the first complete flow

- [x] Test that browser-supplied prices cannot affect the charged amount.
- [x] Test duplicate Checkout Session requests.
- [x] Test duplicate and out-of-order webhook delivery.
- [x] Test that a redirect or success URL cannot mark an order paid.
- [x] Complete a Stripe sandbox purchase from cart through the paid order state.
- [x] Run `bun run check`.
- [x] Run the relevant Convex tests.
- [x] Run `bunx --bun oxlint`.
- [x] Run `bunx convex dev --once` after Convex changes.

## Create orders only after successful Stripe payment

The checklist above records the original implementation. The changes below
replace its pending-order flow and are deployed to the development environment.
Automated checks are complete; the browser sandbox checks below remain.

Target flow:

`cart -> Stripe Checkout Session -> verified successful-payment webhook -> order + order items + emails`

### Rules

- Do not create an `orders` document before payment.
- Do not add a local checkout/draft table just to support this flow.
- A Stripe Checkout Session is the only pre-payment state; abandoned, failed, or
  expired Sessions create no local order.
- The success URL is presentation only. It must never create or mark an order paid.
- Create the order only for a verified paid
  `checkout.session.completed` or `checkout.session.async_payment_succeeded` event.
- Make webhook processing idempotent by Stripe Checkout Session ID so retries and
  duplicate events cannot create duplicate orders.

### Implementation

- [x] Remove the pre-payment `createOrder` call from
      `src/convex/stripe/actions/createStripeCheckout.ts`.
- [x] Reuse the existing validation and product lookup rules to prepare trusted
      Checkout data without writing an order: merged quantities, active products,
      immutable product names/prices, currency, customer details, fulfillment method,
      shipping address, and a random guest receipt access token.
- [x] Build Stripe line items from those trusted snapshots. Carry enough verified
      data through the Stripe Session metadata/line-item metadata to reconstruct the
      order in the webhook; never trust browser prices.
- [x] Create a fresh Stripe Session per submission, without checkout retry tracking,
      browser checkout snapshots, or a metadata version marker.
- [x] Add an internal webhook mutation that creates a paid order and its items in
      one transaction after validating the signed Stripe event, Session identity,
      payment status, currency, total, line items, and metadata.
- [x] Add a unique/indexed lookup for `stripeCheckoutSessionId` and return the
      existing order when Stripe retries the same successful event.
- [x] Move customer/admin order-created emails into the successful-payment order
      creation path. Never send them when Checkout merely starts.
- [x] Treat `checkout.session.completed` with an unpaid status as pending Stripe
      state only; wait for `checkout.session.async_payment_succeeded`. Failed or
      expired Sessions must not create orders.
- [x] Remove the legacy webhook path that updated pre-payment orders; new orders
      are always inserted paid.

### Checkout UI and receipt flow

- [x] Change the Checkout action result so it returns the Stripe URL/session
      reference, not a newly-created order ID.
- [x] Do not add an order to guest local storage before payment.
- [x] Keep the cart until the payment-created order is visible; clear it after
      successful order creation/receipt loading.
- [x] Make the success page wait for the webhook-created order instead of showing
      "not found" while the webhook is still processing.
- [x] Add the created order to guest local storage only after it exists.

### Verification

- [x] Abandoning or expiring Checkout creates no Convex order or order items.
- [x] A successful immediate payment creates exactly one paid order and sends the
      order-created emails once.
- [x] A delayed payment creates the order only on
      `checkout.session.async_payment_succeeded`.
- [x] Failed, unpaid, invalid, tampered, duplicate, and out-of-order webhook
      events are handled safely.
- [ ] Verify the receipt waiting state and automatic update in a browser with Stripe sandbox.
- [ ] Verify guest order storage and first-return cart clearing in a browser after a sandbox payment.
- [x] Run `bun run check`, the relevant Convex tests, `bunx --bun oxlint`, and
      `bunx convex dev --once` after Convex changes.
- [ ] Complete a new end-to-end Stripe sandbox purchase using this updated flow.

## After the first payment flow works

- [ ] Add expired Checkout Session recovery.
- [ ] Add refund event handling and refund state updates.
- [ ] Add inventory handling at the chosen reservation or payment boundary.
- [ ] Build the dashboard metrics and aggregates from verified order payment state.
