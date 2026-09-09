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

Today is initially selected. A custom range may include at most 366 consecutive days. The UI
must prevent or clearly validate longer ranges before requesting dashboard data.

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

Use an appropriate readable interval for the selected range: hourly points for Today and daily
points for longer ranges. Tooltips should show the exact period and formatted revenue value.
Periods with no revenue should appear as zero so gaps are not mistaken for missing data.

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

## Required to build

The payment lifecycle must be implemented before the financial dashboard. Stripe will be the
authoritative source of successful payments and refunds; adding an item to a cart or creating a
pending order must never be treated as revenue.

Implement the prerequisites in this order:

1. Integrate Stripe checkout and verified Stripe webhooks. A successful payment event marks the
   matching order as paid, while refund events update its refund state and amount. These updates
   must be idempotent because Stripe may deliver the same webhook more than once. Admin actions
   must not be able to invent a successful payment.
2. Extend orders with the financial facts required for reporting: `paidAt`, `refundedAt`, and
   `refundedAmountInCents`. Use Stripe event data to populate them. `_creationTime` describes when
   an order was created and `updatedAt` describes its latest change; neither is an accurate
   substitute for when money was received or refunded.
3. Extend the existing order aggregate so eligible orders are keyed by `paidAt` and contribute
   `totalInCents - refundedAmountInCents` as their summed revenue value. The same aggregate range can
   provide paid-order counts and revenue totals efficiently. Average order value is derived from
   revenue divided by the paid-order count.
4. Add status-based aggregate projections for the actionable order groups: pending payment, paid
   but unfulfilled, refund pending, and any formally defined cancellation state that requires
   intervention. Every mutation or webhook that changes an order must update these projections in
   the same transaction.
5. Create one admin-only dashboard query accepting `from` and `to`. It validates that the selected
   range is no longer than 366 days, derives the immediately preceding equal-duration comparison
   range, and returns the summary metrics, attention counts, and revenue trend together. Missing
   chart intervals are returned as zero-value points.
6. Build the dashboard UI against that single query. Store the selected timeframe in URL
   parameters so it is explicit, refresh-safe, and shareable.

Until Stripe provides a trusted `paidAt` and refund history, revenue, paid-order count, average
order value, comparisons, and revenue trends cannot be financially reliable.
