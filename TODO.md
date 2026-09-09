# TODO

## Complete the Stripe checkout payment slice

The universal Stripe client and verified `/stripe/webhook` endpoint are already set up. The next goal is:

`cart -> pending order -> Stripe-hosted Checkout -> webhook-verified paid order`

### 1. Extend orders

- [ ] Add optional `stripeCheckoutSessionId`.
- [ ] Add optional `stripePaymentIntentId`.
- [ ] Add optional `checkoutStatus`.
- [ ] Add optional `paidAt`.
- [ ] Add optional `refundedAt`.
- [ ] Add optional `refundedAmountInCents`.
- [ ] Update the related validators and return types.
- [ ] Add only the indexes required by actual checkout or webhook lookups.

Keep these fields optional so existing orders remain valid without a backfill.

### 2. Create a Stripe Checkout Session

- [ ] Add a server-side Convex action that loads the existing pending order and its immutable item snapshots.
- [ ] Reject orders that cannot be paid, such as already-paid or cancelled orders.
- [ ] Build Stripe line items exclusively from trusted stored prices, quantities, currency, and product data. Never accept prices from the browser.
- [ ] Create a hosted Stripe Checkout Session in `payment` mode.
- [ ] Put the Convex order ID in Stripe metadata.
- [ ] Use a stable idempotency key so retries cannot create duplicate Checkout Sessions.
- [ ] Persist the Checkout Session ID on the order through an internal mutation.
- [ ] Return only the Stripe Checkout URL needed by the client.

### 3. Connect the checkout UI

- [ ] Make checkout submission create or reuse the pending order.
- [ ] Call the Checkout Session action and redirect to its returned URL.
- [ ] Prevent accidental double submission and show a useful error if session creation fails.
- [ ] Treat the success URL as presentation only; returning from Stripe must never mark an order as paid.

### 4. Apply verified webhook events

- [ ] Dispatch verified events from the existing webhook route to an internal mutation.
- [ ] Handle `checkout.session.completed`, marking the order paid only when Stripe reports a paid payment status.
- [ ] Handle `checkout.session.async_payment_succeeded`.
- [ ] Handle `checkout.session.async_payment_failed`.
- [ ] Validate the environment, order metadata, Checkout Session ID, currency, and total before updating an order.
- [ ] Store the Payment Intent ID and `paidAt` exactly once.
- [ ] Make processing idempotent and safe when Stripe retries or delivers events out of order.
- [ ] Return success only after the event has been processed or durably scheduled; return an error when Stripe should retry.

### 5. Verify the first complete flow

- [ ] Test that browser-supplied prices cannot affect the charged amount.
- [ ] Test duplicate Checkout Session requests.
- [ ] Test duplicate and out-of-order webhook delivery.
- [ ] Test that a redirect or success URL cannot mark an order paid.
- [ ] Complete a Stripe sandbox purchase from cart through the paid order state.
- [ ] Run `bun run check`.
- [ ] Run the relevant Convex tests.
- [ ] Run `bunx --bun oxlint`.
- [ ] Run `bunx convex dev --once` after Convex changes.

## After the first payment flow works

- [ ] Add expired Checkout Session recovery.
- [ ] Add refund event handling and refund state updates.
- [ ] Add inventory handling at the chosen reservation or payment boundary.
- [ ] Build the dashboard metrics and aggregates from verified order payment state.
