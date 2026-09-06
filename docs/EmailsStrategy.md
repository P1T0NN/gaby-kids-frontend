# Email Strategy

This is the default transactional-email policy for ecommerce apps built from
this template. Send an email when the recipient can act on it, needs a record
of an important event, or must be alerted to a problem. Orders, inventory, and
payments are not implemented yet, so those messages apply when those features
are added.

## General rules

- Send from the server after a durable, server-confirmed state change. A client
  redirect or button click is not proof that an order or payment succeeded.
- Keep transactional and marketing email separate. Marketing requires explicit
  opt-in, an unsubscribe path, and must never be mixed into a required message.
- Make sends idempotent by event and order ID. Webhook retries must not create
  duplicate emails; retry delivery failures without changing the business
  state.
- Render and deliver through the server-side email integration. Include only
  the data needed for the recipient, never passwords, secrets, or full payment
  details.
- Use the customer's locale when available, and include a clear next step,
  support contact, and a safe link back to the app.

## Customer emails

| Trigger | When to send | Include |
| --- | --- | --- |
| Email verification | Immediately after sign-up or an explicit resend, respecting the resend cooldown | One-time code or link, expiry, and support guidance |
| Password reset | Immediately after a reset is requested; keep the UI response generic for unknown addresses | One-time code or link, expiry, and a warning if it was not requested |
| Account security change | After a password, email address, or other high-impact account change succeeds | What changed, when, and how to report unauthorized activity |
| Paid order confirmation | After the server verifies payment, preferably from the payment webhook rather than the success-page redirect | Immutable item and price snapshot, total, order reference, and current fulfillment status |
| Payment failure or checkout expiry | Only after the server confirms that customer action is needed | Safe explanation, recovery link, and order reference |
| Fulfillment or shipment | When the order is actually fulfilled or shipped | Status, tracking details when available, and support contact |
| Cancellation or refund | After cancellation or the payment provider confirms the refund | Affected order, amount, status, and expected next step or timing |
| Support response | When staff replies to a customer request | The reply preview and a secure link to continue the conversation |

If Stripe payment receipts are enabled, use Stripe for the payment receipt and
send the app's email for order and fulfillment information only; do not send
two competing receipts.

## Admin emails

Send to a configured operations address or admin group, not to every admin
account individually unless the app explicitly needs per-admin routing.

| Trigger | When to send | Include |
| --- | --- | --- |
| New paid order | Immediately after payment is verified | Order reference, total, customer contact, fulfillment link, and any stock warning |
| Payment, refund, or dispute problem | Immediately when human action is required; retry automatically first where safe | Order/provider reference, current state, safe error summary, and a dashboard link |
| Order processing mismatch or stuck order | After bounded retries or when an order passes its service-level deadline | What is unresolved, last attempted action, and the next operator action |
| Low or out-of-stock inventory | When a threshold is crossed, preferably as a digest for repeated low-stock events | Product, current availability, threshold, and admin link |
| Customer support or contact request | Immediately when a response is expected | Customer message, urgency, and reply link |
| Security or permission event | Immediately for admin-role changes, suspicious activity, or an unusual authentication failure spike | Event, affected account, time, and investigation link; never include secrets |

Routine product edits, audit entries, normal logins, abandoned carts, duplicate
webhooks, and ordinary order-status changes belong in the admin dashboard rather
than email. Email the admin only when the event is actionable or time-sensitive.

## Delivery expectations

Customer and admin email delivery must be asynchronous and observable. A
provider failure should retry and create a visible operational error; it must
not undo a paid order or hide the order from the dashboard. Keep the durable
order/account history authoritative, and treat email as a notification of that
history rather than the source of truth.
