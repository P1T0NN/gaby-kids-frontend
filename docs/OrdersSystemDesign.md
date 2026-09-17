# Orders System Design

Status: initial order foundation implemented on 2026-09-06.
Products have server-owned prices; checkout creates pending order and item
snapshots. Stripe-hosted Checkout and payment synchronization are the next
implementation phase; inventory remains a later prerequisite before tracked
stock is sold. See
[CodingRules.md](./CodingRules.md). This replaces the previous orders proposal;
[ProductSystemDesign.md](./ProductSystemDesign.md) remains historical, not a
prerequisite implementation plan.

## 1. Scope and responsibilities

Start with Stripe-hosted Checkout, ordinary products, one store currency, one
session per order, immediate capture, guest/account checkout, whole-order
fulfillment, cancellation, and full refunds.

Before implementation, products need a selling price and explicit tracked or
untracked inventory policy. A product is the purchasable unit initially; do not
restore default variants just to sell it. These are future prerequisites, not
changes to the current catalog in this documentation task.

| Stripe handles                                                     | The app still handles                                          |
| ------------------------------------------------------------------ | -------------------------------------------------------------- |
| Payment form, card handling, payment authentication and processing | Server-owned prices, product eligibility, quantity validation  |
| Configured payment fraud screening                                 | Order ownership, private receipts, admin permissions           |
| Checkout address collection and final amount presentation          | Purchase snapshots, inventory, fulfillment                     |
| Configured shipping options and Stripe Tax                         | Verified payment synchronization and duplicate-safe operations |

Hosted Checkout reduces PCI scope by keeping card data out of the app; it does
not eliminate merchant obligations or protect app endpoints.
[Stripe security](https://docs.stripe.com/security/guide).

Use the Stripe SDK directly, server-side credentials, and a restricted key with
the necessary permissions where supported. No generic provider abstraction,
custom card form, or separately managed PaymentIntent workflow.

Defer bundles, variants, personalization, partial refunds/shipments, exchanges,
subscriptions, warehouses, upsells, and order images until needed.

## 2. Two tables

### Orders

Store verified account ownership or a guest-access-secret hash; a random
checkout retry key and normalized submitted product IDs/quantities; currency;
Stripe session/payment/refund references; necessary contact/shipping snapshots;
and verified completed Checkout subtotal, shipping, tax, and total in minor
units. Final totals remain absent until known. Store billing details only when
needed for business documents.

Keep payment status (pending, paid, refund_pending, refunded), fulfillment status
(unfulfilled, fulfilled), optional cancellation timestamp, and whole-order stock
state (none, held, committed, released, restocked). No extra commercial status
duplicating these facts.

Session setup needs a small durable state (not_started, creating, ready, closed)
and fixed creation parameters, including expiry, for identical retries. Keep
relevant timestamps, next reconciliation time, and an optional review reason.

Index customer history, retry keys, Stripe references, and due recovery work.
Enforce key/reference uniqueness transactionally; indexes alone do not enforce
it. Use the order ID as the initial reference, without a sequence generator.

### Order items

One row per product: order ID, source product ID, purchased name, unit price,
quantity, and whether inventory was tracked at purchase. Merge duplicate product
lines. Index by order and source product for details and stock/deletion checks.

Snapshots are immutable and render receipts without catalog joins, even after
product deletion. Never cascade-delete orders or items with the product. Text
snapshots suffice; remove image-copy machinery.

Remove the stock-allocation table. Each ordinary product line consumes its own
inventory and whole-order transitions share one stock state. Add allocations
only when bundles or partial stock operations actually require them.

## 3. Checkout and pricing

The browser submits product IDs, quantities, and a retry key, never authoritative
prices, ownership, stock, or status. Validate safe integer money/counts and bound
the request: initially 50 distinct products, 99 units per product, and bounded
payload size. Validate merged quantities too.

One mutation authorizes the caller, checks the retry key, reads active products,
snapshots prices, checks/reserves stock, inserts order/items, and schedules
session setup. All writes succeed or fail together. Authorize before returning
an existing order: identical submitted lines return it; changed lines conflict.
A new purchase needs a new key.

The action creates Checkout in payment mode from stored snapshots with trusted
order metadata and a stable order-derived idempotency key. Keep one session per
order. Disable adjustable quantities, promotions, currency conversion, and
automatic abandoned-session recovery initially so payment matches reserved goods.

Checkout collects addresses and presents the final amount for buyer acceptance.
The storefront subtotal is an estimate. Remove the custom preview fingerprint,
external quote token, tax engine, and discount-allocation logic. Price edits
after order creation do not change its session inputs.

Configure destinations, a simple shipping policy, and consistent inclusive or
exclusive pricing before launch. If using Stripe Tax, confirm active
registrations and appropriate product tax codes; enabling automatic tax alone
does not establish that tax is collected.
[Checkout tax](https://docs.stripe.com/tax/checkout),
[tax registrations](https://docs.stripe.com/tax/registrations-api).

Copy verified final amounts and needed addresses from completed Checkout once.
Validate line prices, quantities, currency, shipping choice, and tax configuration
against stored inputs. Do not compare the tax-inclusive final total to the
pre-checkout merchandise estimate.

## 4. Payment synchronization

Use one small synchronization path for webhooks and recovery. Verify signatures
against the raw body, retrieve Stripe state as needed, and validate environment,
order metadata, session/payment identity, and commercial details. Only internal
mutations update payment state.

Subscribe the Stripe webhook endpoint only to events this workflow handles:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`
- `refund.created`
- `refund.updated`
- `refund.failed`

The asynchronous Checkout events support delayed payment methods. They may remain
enabled even while the store initially offers only immediate methods. Session
expiry closes abandoned pending checkouts and releases any future stock hold.
Refund events keep app state correct whether a refund begins in the app or in the
Stripe Dashboard. Do not also subscribe to broad `payment_intent.*` or `charge.*`
families unless a concrete handler is added; overlapping events must not create
multiple competing state-transition paths.

Transitions check allowed source states. Duplicate or reordered events cannot
repeat stock movement or regress payment state. An early webhook can bind a
verified session before setup attaches it, enforcing unique references in the
same transaction. Acknowledge after processing or durably scheduling work.

A redirect is not payment proof. Fulfillment must tolerate repeated and concurrent
calls; order/session guards suffice for this limited workflow. Defer a raw event
archive and general event-processing framework.
[Stripe fulfillment](https://docs.stripe.com/checkout/fulfillment),
[webhook handling](https://docs.stripe.com/webhooks).

Timeout during creation means unknown outcome: retry identical stored parameters
with the same key, never a replacement session. Stripe can prune keys after
24 hours; older ambiguous creation needs reconciliation/manual review before
another creation attempt.
[Stripe idempotency](https://docs.stripe.com/api/idempotent_requests).

One bounded scheduled sweep handles due setup/payment/refund work with bounded
backoff and the same transitions. Display unresolved cases in the admin order
list, without a separate reconciliation dashboard. Webhook retries cannot recover
an app action that failed before recording its session ID.

## 5. Stock, cancellation, and refunds

Stripe does not reserve app inventory. Tracked products maintain
`0 <= reserved <= onHand`. Check availability and reserve in one transaction;
admin stock adjustments respect holds. Use existing rate limits against
checkout/stock-hold abuse. Do not split reservations into independent writes.

| Event                                     | Guarded atomic stock effect                          |
| ----------------------------------------- | ---------------------------------------------------- |
| Create                                    | Increase reserved; none to held                      |
| Verified payment                          | Subtract from onHand and reserved; held to committed |
| Confirm unpaid checkout cannot complete   | Subtract reserved; held to released                  |
| Fulfillment                               | No stock change                                      |
| Refund                                    | No automatic stock change                            |
| Admin confirms goods available for resale | Increase onHand once; committed to restocked         |

Untracked-only orders keep stock state none.

Set expiry to 30 minutes from session creation. A cancel URL or elapsed local
deadline does not prove payment is impossible. Release holds after verified
Stripe expiry/cancellation, or atomically close setup that provably never
started. Setup workers must respect that gate.
[Stripe limited inventory](https://docs.stripe.com/payments/checkout/managing-limited-inventory).

Initially configure immediate payment methods through Stripe's Dashboard/payment
method configuration. Delayed methods need a pending-payment inventory policy
before enabling them. Unexpected pending payments retain holds and flag review;
session completion alone never authorizes fulfillment or release.

Payment racing cancellation uses the same guarded transitions. Payment with
holds commits them. Payment discovered after release is recorded and routed to
full refund/review; never fulfill without stock or ignore captured money.
Cancellation is terminal: do not expose a restore transition. Correct mistakes
with a replacement order so payment, stock, and notification history remains
explicit.

Refund first atomically sets refund_pending and blocks fulfillment, then
schedules the Stripe call with a stable refund key. Confirm the result before
marking refunded. Retry unknown outcomes as the same operation; failed refunds
stay blocked for review. Synchronize Dashboard refunds too. Unexpected partial
refunds or disputes block unshipped fulfillment for review without requiring a
partial-refund engine.

Fulfillment requires paid, unfulfilled, uncancelled, and no refund/review hold.
Refunds preserve shipment facts. Restock only after an audited whole-order
decision that all goods are available for resale.

Block product deletion/tracking changes while holds or unfulfilled stock
obligations remain. Historical orders alone do not prevent deletion. Returns
after product deletion require an explicit no-restock decision; defer
replacement-stock mapping.

## 6. Access and views

Use existing authenticated/admin builders and authorize every order read and
command. Guests need a separate high-entropy receipt secret, stored only as a
hash, for retries, session retrieval, and receipt access. Prefer a protected
HTTP-only session exchange for receipt links. Order IDs, email, Stripe session
IDs, and retry keys are not sufficient authorization. Matching email alone
cannot link a guest order to an account.

Reuse existing tables, pagination, forms, dialogs, and loading/error states.
Load bounded item snapshots for details, not every list row. Keep addresses and
guest hashes out of public/unrelated queries and secrets/personal data out of logs.

Confirmation may show processing until verified state arrives. Remove only
purchased cart quantities after payment confirmation, once per order, preserving
later additions. Enable Stripe payment receipts instead of another receipt-mail
pipeline; keep app order history independently.

Define contact/address retention before production, without building a general
retention framework as part of checkout.

## 7. Implementation and proof

1. Add minimal product pricing/inventory when implementation is requested;
   do not restore the historical variants/bundles design.
2. Build two order tables, authorization, snapshots, and atomic reservation.
3. Connect Checkout, verified webhooks, expiry/recovery, and full refunds.
4. Add confirmation/history and admin fulfillment/refund/restock controls.
5. Run relevant Convex tests, type checks, `bunx --bun oxlint`, and Stripe sandbox
   scenarios before paid launch.

Minimum checks: reject tampering/unauthorized reads; prevent concurrent oversell;
deduplicate orders/sessions; recover lost API responses; tolerate repeated and
reordered webhooks; resolve payment/expiry races; never restock unreturned goods;
preserve receipts after product deletion. Database tests cover transaction
invariants; Stripe sandbox tests cover the external lifecycle.
