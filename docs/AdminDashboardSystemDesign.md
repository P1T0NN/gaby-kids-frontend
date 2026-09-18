# Admin Dashboard System Design

## Purpose

The admin dashboard is a decision screen for business owners, not a general analytics
workspace. It should answer the most important operational questions immediately:

- How much money did the store make?
- How many orders were successfully paid?
- How much is an average paid order worth?
- Which orders currently need attention?
- Is revenue improving or declining over the selected period?

Upsell analytics and other behavioral analytics are intentionally excluded. They belong in a
separate analytics area if the business needs them later.

## Timeframe selector

A single timeframe control appears in the top-right of the dashboard and controls every metric
and chart on the page. It offers:

- Today
- Last 7 days
- Last 30 days
- Last 90 days
- Custom range

Today is initially selected. A custom range may span at most 366 consecutive days; the UI must
prevent or clearly validate longer ranges before requesting dashboard data. Within that bound, the
backend validates that the bounds are ordered and not in the future and adapts trend resolution to
the selected span. The 366-day limit is the only range-length cap.

All range boundaries use the store's configured timezone. The selected range should remain
visible at all times so an owner never has to guess which period the numbers describe.

Where a comparison is shown, compare the selected range with the immediately preceding range
of equal duration. For example, the last 7 days are compared with the 7 days before them. Show
both the percentage change and its direction. If the previous value is zero, show a neutral
“No previous data” state instead of an invalid or misleading percentage.

## Dashboard content

### Revenue

Show the total value of paid, non-cancelled orders within the selected timeframe. Pending
payments must never inflate revenue. Refunded amounts must not remain counted as earned revenue;
the final implementation should use the store's authoritative payment state and refund amount.

The primary value is the formatted currency total. A smaller secondary line shows the change
from the preceding equal-length period.

### Paid orders

Show the number of orders that became successfully paid within the selected timeframe. Pending,
failed, or cancelled unpaid orders are excluded. Display the comparison with the preceding
period using the same rules as revenue.

### Average order value

Average order value is:

`paid revenue / number of paid orders`

Use the same eligible orders as the revenue and paid-order metrics. If there are no paid orders,
display a clear empty value such as “No paid orders” rather than dividing by zero or showing a
misleading currency amount.

### Orders requiring attention

Show actionable order counts for the selected timeframe, grouped into a small number of clear
states:

- Pending payment
- Paid but unfulfilled
- Cancellation or refund requiring action

This area should help the owner decide what to work on next. Each state should link to the orders
view with the matching filter already applied. Use warning or destructive styling only for
states that genuinely require intervention; do not make every status compete for attention.

### Revenue trend

Show a simple revenue-over-time chart for the selected timeframe using only eligible paid
revenue. The chart should emphasize the overall direction without unnecessary controls,
decorations, or multiple competing series.

The trend is served from write-time bucket projections maintained at several resolutions (hour,
day, week, month), never from event logs or scans. The query adapts the resolution to the selected
span so the number of returned points stays bounded within the 366-day limit. Tooltips should show
the exact period and formatted revenue value. Periods with no revenue should appear as zero so
gaps are not mistaken for missing data.

### Top products

Show the products that earned the most within the selected timeframe, ranked by net paid revenue,
together with the revenue value and units sold for each. The ranking is served from a per-product
bucket projection: every paid order line adds its revenue and units to the product's bucket, and
rolling-window leaderboards are maintained off the request path so common ranges are constant
reads. Any custom range derives its ranking from the same projection; its read cost grows only
with catalog size, never with order volume.

## Information hierarchy and cognitive load

The dashboard must be understandable within seconds. Place the timeframe selector beside the
page heading, then show Revenue, Paid orders, and Average order value as the first compact summary
cards. Place Orders requiring attention next because it is actionable, followed by the wider
Revenue trend chart for context.

Keep the interface low-cognition-load:

- Use plain business language and avoid internal database or payment terminology.
- Give every card one primary number and, at most, one comparison value.
- Keep currency, number, date, and percentage formatting consistent.
- Use whitespace and alignment to separate concepts instead of excessive borders or colors.
- Reserve strong color for meaningful positive, negative, warning, or destructive states.
- Show concise loading skeletons without moving the final layout.
- Use explicit empty states such as “No paid orders in this period.”
- Keep filters, legends, and secondary controls out of the dashboard unless they support an
  immediate business decision.

The owner should be able to identify store performance, notice urgent work, and understand the
revenue direction without interpreting analytics terminology or scanning a dense report.

## Scalability requirements

The dashboard must stay correct and cheap at any business size: hundreds of concurrent admin
loads, tens of thousands of orders, hundreds of thousands of users. Scale comes from the
projections, never from the read path.

- Every number on the page — revenue, paid orders, average order value, attention counts, trend,
  and top products — is served from write-time projections updated in the same transaction as the
  write that changes it. No dashboard read scans a table, calls `.collect()`, or relies on an
  arbitrary `.take(n)` cap for correctness.
- Per-render read cost is constant with respect to order and user volume. It grows only with the
  number of buckets the selected range resolves to and, for product rankings, with catalog size.
- Time-grouped projections are maintained at several resolutions (hour, day, week, month). Long
  ranges read coarse buckets plus a bounded set of edge buckets instead of every fine bucket;
  short ranges read fine buckets. Adaptive resolution keeps the returned point count bounded
  within the 366-day limit, which is the only range-length cap in the system.
- The dashboard is exactly one admin query per render; every panel reads from that response, so
  concurrent admins share the same cached projections instead of multiplying work.
- Financial projections are kept indefinitely. Behavioral raw events (the analytics component)
  are never an input to revenue, paid counts, or trends, so retention pruning cannot change money.
- Because projections are updated transactionally with their source documents, no reconciliation
  or full-scan job is needed for correctness.

## Required to build

The payment lifecycle must be implemented before the financial dashboard. Stripe will be the
authoritative source of successful payments and refunds; adding an item to a cart or creating a
pending order must never be treated as revenue.

Implement the prerequisites in this order:

1. Establish the universal Stripe foundation before connecting the checkout UI:
   - Keep Stripe calls server-side through the installed Stripe SDK; do not add a payment-provider
     abstraction or a custom card form.
   - Store `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in each Convex deployment's environment,
     with separate test and live credentials. `.env.local` alone does not configure deployed
     Convex functions. Prefer a restricted Stripe key with only the required permissions when the
     integration has been verified with it.
   - Create one shared server-side Stripe client/configuration with a deliberate API version.
   - Register one HTTP webhook endpoint that verifies the signature against the unmodified request
     body before processing any event.
   - Use one idempotent payment-synchronization path shared by webhooks and reconciliation. Never
     log credentials, webhook signatures, or unnecessary customer data.
   - Subscribe only to handled events: `checkout.session.completed`,
     `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`,
     `checkout.session.expired`, `refund.created`, `refund.updated`, and `refund.failed`.
2. Integrate Stripe-hosted Checkout. A successful verified payment event marks the matching order
   as paid, while verified refund events update its refund state and amount. Repeated or reordered
   events must not repeat side effects or regress order state. Admin actions and success-page
   redirects must not be able to invent a successful payment.
3. Extend orders with the financial facts required for reporting: `paidAt`, `refundedAt`, and
   `refundedAmountInCents`. Use Stripe event data to populate them. `_creationTime` describes when
   an order was created and `updatedAt` describes its latest change; neither is an accurate
   substitute for when money was received or refunded.
4. Add a paid-orders aggregate projection as a namespaced tree on the existing orders aggregate
   mount. Eligible orders (trusted `paidAt`, not cancelled) are keyed by `paidAt` and contribute
   `totalInCents - refundedAmountInCents` as their summed revenue value, so a single range read
   returns both the paid-order count and the net revenue. Average order value is derived from
   those two values. Refunds restate the original `paidAt` bucket, keeping past periods truthful.
5. Add current-state aggregate projections for every actionable group: pending payment, paid but
   unfulfilled, refund pending, and any formally defined cancellation state that requires
   intervention. Each group is a namespace in a namespaced aggregate tree, so each count is a
   single projection read. Product attention (unpublished products, low stock) uses the same
   pattern with a namespaced product-status tree and a variant stock tree. Every mutation or
   webhook that changes an order, product, or variant must update the matching projection in the
   same transaction.
6. Create one admin-only dashboard query accepting `from` and `to`. It validates that the range is
   no longer than 366 days and that the bounds are ordered, derives the immediately preceding
   equal-duration comparison range, and returns the summary metrics, attention counts, revenue
   trend, and top products together. Missing chart intervals are returned as zero-value points.
   The query adapts trend resolution to the range and reads only projections, so its cost is
   independent of order and user volume and grows only with the returned bucket count.
7. Build the dashboard UI against that single query. Store the selected timeframe in URL
   parameters so it is explicit, refresh-safe, and shareable.

Until Stripe provides a trusted `paidAt` and refund history, revenue, paid-order count, average
order value, comparisons, and revenue trends cannot be financially reliable.

## Implementation plan

Build in the chunks below, in order. Each chunk is additive, ends in a reviewable state, and
changes no user-visible behavior until the frontend chunk. Every chunk runs `bunx --bun oxlint`
plus `bun run test:convex`; backend chunks also run `npx convex dev --once` (new mounts and
migrations are deploy steps).

### Chunk 0 — Shared contracts and bucket math

Agree on the cross-cutting pieces before any projection exists.

- `src/shared/features/analytics/config.ts`: keep `maxCustomRangeDays: 366` as the only
  range-length cap; add the resolution thresholds (hour/day/week/month) and the store timezone
  source.
- `src/shared/features/analytics/types/analyticsTypes.ts`: bucket/resolution types and the
  dashboard response envelope (summary, attention, trend point, top product).
- `src/shared/features/analytics/utils/`: `getBucketStart`, `getBucketRange`, `pickResolution`,
  `buildZeroFilledSeries` as pure, tested helpers.
- Resolve the store timezone source; every bucket boundary depends on it.

Review gate: bucket definitions, resolution thresholds, timezone source, and unit tests for
boundary and DST cases.

### Chunk 1 — Paid revenue projection

- Add `paidOrdersAggregate` as a namespaced tree on the existing `ordersAggregate` mount:
  namespace `eligible` when a trusted `paidAt` exists and the order is not cancelled, keyed by
  `paidAt`, summed as `totalInCents - refundedAmountInCents`.
- Register its `idempotentTrigger()` in `src/convex/aggregates/triggersAggregate.ts`.
- Add a backfill migration over existing orders and a read helper returning revenue and paid-order
  count for a `[from, to]` range.

Review gate: eligibility rules (pending, cancelled, refund pending, refunded), refund netting,
namespace transitions, and migration idempotency.

### Chunk 2 — Attention projections

- Add `ordersByAttentionAggregate` (same mount) with namespaces `pending_payment`,
  `paid_unfulfilled`, and `refund_pending`; the trigger keeps entries correct through every order
  mutation and webhook.
- Read the existing drafts count from `productsByStatusAggregate` namespace `draft`.
- Add a `productVariantsAggregate` mount with a stock-namespaced tree (`low`, `out`, `ok`) plus
  trigger and backfill migration.
- Add one read helper returning all attention counts.

Review gate: namespace definitions, cancellation handling, transition coverage across
`completeCheckoutReservation`, `updateOrderAdmin`, `applyStripeRefund`, and variant stock writes.

### Chunk 3 — Revenue trend projections

- Add the `salesBuckets` table keyed by `(resolution, bucket)` with revenue, paid-order, and unit
  values, maintained at hour/day/week/month resolutions.
- Write bucket deltas in the same transaction as `completeCheckoutReservation`; refunds apply
  their net delta to the original `paidAt` buckets so past periods stay truthful.
- Backfill from historical paid orders; build the zero-filled, resolution-aware series helper.

Review gate: bucket keys and timezone boundaries, refund restatement, backfill correctness,
zero-fill behavior.

### Chunk 4 — Top products projections

Develop in two reviewable halves.

- 4a: per-product bucket rows written with each paid order line (revenue and units, refund
  adjustments included) and the resolution-aware ranking read for custom ranges.
- 4b: rolling-window leaderboard snapshots (today, 7, 30, 90 days) maintained off the request path
  by a scheduled job so the common ranges become constant reads; document the freshness contract.

Review gate: ranking correctness against fixtures, refund adjustments (4a), then snapshot
idempotency and freshness (4b).

### Chunk 5 — Dashboard query

- Add `fetchAnalyticsDashboardAdmin({ from, to })` with argument and return validators: validate
  the 366-day cap, ordering, and future bounds; derive the immediately preceding equal-duration
  range; return summary, previous summary, attention counts, adaptive-resolution zero-filled
  trend, and top products together.
- Read only projections; no scans, no `.take(n)` correctness caps.

Review gate: response envelope shape and validation errors before any UI work starts.

### Chunk 6 — Frontend wiring

- Replace the zero-data scaffolding in `useAnalyticsDashboard` with the single `useQuery`, keeping
  the existing view models; store the selected timeframe in URL parameters; default to Today per
  this document.
- Add local loading, error, and empty states to the stats, attention, chart, and top-products
  components without moving the final layout; keep the explicit empty copy ("No paid orders in
  this period.").

Review gate: URL state behavior, loading/empty rendering, and formatting consistency.

### Chunk 7 — Hardening

- Reconciliation pass: rerun the migrations against a seeded deployment and verify the dashboard
  totals equal direct order sums.
- Performance smoke with concurrent dashboard loads; remove leftover scaffolding
  (`adminDashboardData.ts`) and update this document if any rule changed during implementation.

Review gate: the numbers reconcile, no dead code remains, and the document matches the shipped
behavior.
