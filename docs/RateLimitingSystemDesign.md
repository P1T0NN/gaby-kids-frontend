# Rate Limiting System Design

## Decision

Authentication and rate limiting solve different problems:

- Authentication identifies the caller.
- Rate limiting controls how much work the caller may consume.

Every public side-effecting operation must be protected on the server. Rate
limiting does not replace authentication, authorization, validation,
idempotency, deduplication, verification, or provider quotas.

Use authenticated actor limits whenever an identity exists. Use tenant,
resource, session, edge, or provider limits when they answer a separate abuse
or capacity question. A global bucket is only a circuit breaker or provider
budget, never the normal fairness mechanism.

Application rate limiting is not DDoS protection. Volumetric abuse, connection
limits, bot challenges, and trustworthy IP controls belong at an owned HTTP,
CDN, WAF, or hosting boundary. A direct browser-to-Convex mutation must not
trust a client-provided IP, user agent, user ID, or rate-limit key.

## Current implementation

The template mounts `@convex-dev/rate-limiter` and applies it through the
public and authenticated function builders.

- Authenticated actor keys use `ctx.auth` and `tokenIdentifier`.
- Actor-scoped limits are only consumed when an authenticated identity exists.
- Explicit `scope: 'global'` limits are available for shared resources.
- Anonymous Better Auth sessions and the anonymous fallback bucket are not
  currently used.

The default policy uses fixed windows:

| Window    |        Maximum |
| --------- | -------------: |
| 1 minute  |  20 operations |
| 5 minutes |  60 operations |
| 1 hour    | 300 operations |

Each operation consumes three buckets, named with `:minute`, `:fiveMinutes`,
and `:hour` suffixes. All checks run in the same Convex mutation with
`throws: true`; if a later check fails, earlier rate-limit writes roll back
with the transaction. Custom rate-limit configurations remain supported as a
single custom bucket.

## Key rules

Rate-limit keys must be derived on the server:

| Key                  | Use                                                     |
| -------------------- | ------------------------------------------------------- |
| Authenticated actor  | Per-user mutations, uploads, exports, and actions       |
| Tenant               | Shared team or organization budgets after authorization |
| Resource             | Normalized email, phone number, invite, or other target |
| Trusted edge/network | Broad bot and burst controls at an owned boundary       |
| Endpoint/global      | Shared provider or system safety budget                 |

Never accept identity or quota configuration from the client. Resource keys
should avoid raw personal data; use a keyed digest or HMAC with a server-only
secret where appropriate. Counts must be derived from validated server-side
work, bounded, and never allowed to be negative, zero, infinite, or otherwise
attacker-controlled.

## Layering

| Layer                  | Responsibility                                             |
| ---------------------- | ---------------------------------------------------------- |
| Edge/WAF/HTTP boundary | DDoS, IP, connection, request-size, and bot controls       |
| Convex function        | Actor, tenant, resource, endpoint, and provider limits     |
| Domain operation       | Authorization, uniqueness, idempotency, and business rules |
| Queue/provider worker  | Concurrency, cost, vendor quota, and retry limits          |

These layers complement one another. An edge IP limit cannot replace a
per-user or per-resource quota, and a Convex limiter cannot absorb a network
flood.

## Algorithm rules

- Use a **token bucket** for interactive traffic that needs continuous refill
  and bounded bursts. Keep `capacity` intentional and small enough for the
  endpoint's cost.
- Use a **fixed window** for explicit quotas such as operations per minute,
  hour, or day. Expect bursts at window boundaries.
- Use `count` for server-derived cost, such as exported rows, processed files,
  sent messages, or AI tokens.
- Add sharding only to genuinely hot global or provider keys after measuring
  contention.
- Use reservations only for work that can be delayed and is backed by a
  durable job. Add bounded retry jitter; never poll in a tight loop.

## Operation rules

- Protect writes, uploads, messages, authentication attempts, webhooks,
  exports, and paid-provider calls.
- Protect expensive public reads at the HTTP/edge layer or through an explicit
  server-side operation; do not rate-limit every reactive query blindly.
- Authenticated CRUD normally uses an actor key. Add tenant or provider
  limits when the operation consumes shared capacity.
- Webhooks require signature verification and event idempotency before applying
  side effects.
- Internal functions and migrations do not inherit public browser limits, but
  should have explicit worker or provider budgets when they consume scarce
  resources.

## Failure, privacy, and operations

Fail closed for mutations, spam-sensitive actions, paid work, and external
side effects. Return a stable rate-limit error with a safe message and an
optional `retryAfter`; never catch the error and immediately retry.

Do not expose limiter tables, raw keys, full identities, emails, phone numbers,
IP addresses, tokens, or internal quota details. Log only a privacy-safe
operation, outcome, coarse identity class, and correlation ID.

Monitor allowed and rejected requests, retry durations, provider usage, queue
depth, limiter failures, transaction retries, contention, and anonymous/resource
key cardinality. Alert on provider exhaustion, global circuit-breaker pressure,
unusual rejection spikes, and repeated limiter failures.

## Shipping checklist

- [ ] Server-side enforcement exists for every public side effect.
- [ ] Authorization is checked separately from rate limiting.
- [ ] All keys, counts, and policies are derived or selected server-side.
- [ ] Global limits are additional safety budgets, not the only quota.
- [ ] Work and payload size are bounded.
- [ ] Retries and side effects are idempotent.
- [ ] Provider, queue, and edge controls exist where needed.
- [ ] Privacy-safe errors, logs, metrics, and alerts are in place.
- [ ] Authenticated, concurrent, rollback, abuse, and boundary cases are tested.

# Unauthenticated Users Rate Limiting

## 1. Per-mutation CAPTCHA: Cloudflare Turnstile

Use an invisible or managed Turnstile challenge on every form or button that
triggers an unauthenticated mutation, such as a newsletter signup or booking.

The client receives a short-lived, single-use token after the challenge. It
sends that token with the mutation request. Each protected attempt requires a
fresh verification token, making automated repeated attempts more expensive.

Implementation requirements:

- Embed the widget in the relevant frontend forms.
- Verify the token server-side in a Convex action using the Turnstile secret.
- Reject expired or already-used tokens.
- Store a hash of used tokens with a short retention period to prevent local
  replay.

## 2. Anonymous session binding

After successful CAPTCHA verification, issue a random, short-lived anonymous
session ID so the user does not need to solve a challenge for every small
follow-up action.

Store the session with:

- a hash of limited client signals, such as user agent and screen size;
- an IP hash when the request passes through a trusted HTTP boundary;
- an expiry time, for example 30 minutes.

Set the session ID in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie. Validate
the cookie on later requests and compare the available fingerprints. A session
is a rate-limit identity, not an authenticated identity, and must be allowed
to expire or be invalidated.

## 3. Multi-key unauthenticated rate limiting

Unauthenticated traffic should be limited across several independent keys:

- anonymous session ID;
- device or browser fingerprint hash;
- IP address when available from a trusted HTTP boundary;
- optional IP subnet or ASN signal for IP rotation.

Use a reusable, atomic server-side helper. Every protected request checks all
relevant counters and is rejected when any limit is exceeded. Convex mutation
transactions provide the atomicity needed to avoid read-modify-write races.

Do not use a client-provided identity, IP, fingerprint, rate, period, count,
or bucket name as a trusted value.

## 4. Central mutation gatekeeper

All unauthenticated mutations must pass through one gatekeeper so a new public
mutation cannot accidentally bypass protection.

The gatekeeper should:

1. Verify the CAPTCHA token and replay nonce.
2. Validate the anonymous session, expiry, fingerprint, and trusted IP signal.
3. Enforce all applicable multi-key rate limits.
4. Call the actual operation, such as `requestNewsletter` or `createBooking`.

Keep the checks centralized so future controls, such as reputation scoring or
additional challenges, have one integration point.

## 5. Double opt-in and per-email cooldown

For newsletter signups or any mutation that sends email:

- create a pending record instead of activating immediately;
- send a unique, expiring, single-use confirmation token;
- activate the record only after the recipient verifies the token;
- limit confirmation messages to the same email, for example three per day;
- require CAPTCHA and rate limits before every send attempt;
- return the same safe response for new, existing, and pending addresses.

This limits inbox abuse and prevents fake signups from becoming active without
access to the email account.

## 6. Stronger verification for high-impact actions

For actions that create real-world obligations, add stronger checks when risk
signals justify them:

- phone OTP for bookings or expensive actions;
- a deposit or payment-method preauthorization for cash orders;
- manual review for high velocity, datacenter IPs, or other suspicious patterns.

These controls are optional for low-impact operations but recommended for
bookings, orders, and other costly or scarce resources.

## 7. HTTP endpoints for IP and secure cookies

Direct browser-to-Convex calls do not provide a trustworthy client IP and
cannot set `HttpOnly` cookies. Protected unauthenticated flows should use
Convex HTTP actions or an owned HTTP/edge boundary.

That boundary can:

- read `x-forwarded-for` only when the proxy is trusted and configured;
- hash the IP before storing or rate limiting it;
- create and validate the anonymous session cookie;
- call the shared server-side gatekeeper.

Never accept arbitrary forwarded headers or a browser-supplied IP.

## 8. Cleanup, monitoring, and failure behavior

Use scheduled cleanup for expired anonymous sessions, used CAPTCHA nonces,
old rate-limit state, and pending opt-in tokens. This controls database growth
and reduces replay surface.

Monitor blocked attempts by reason, without logging raw personal data:

- CAPTCHA failure;
- invalid or expired session;
- rate-limit rejection;
- IP or fingerprint reputation signal;
- provider or verification failure.

Alert on spikes, repeated failures, unusual key growth, and limiter errors.
Fail closed when CAPTCHA verification or the rate-limit store is unavailable
for a mutation that can cause cost, spam, or a real-world side effect.

## Summary: use versus build

| Layer                         | External service or built-in           | Build in the application                                  |
| ----------------------------- | -------------------------------------- | --------------------------------------------------------- |
| CAPTCHA                       | Cloudflare Turnstile                   | Frontend widget and server-side verification action       |
| Anonymous session             | Convex database                        | Session creation, validation, expiry, and cookie handling |
| Unauthenticated rate limiting | Convex rate-limiter or Convex database | Multi-key policy and reusable gatekeeper check            |
| Mutation gatekeeper           | Convex actions and mutations           | Central verification and orchestration                    |
| Double opt-in                 | Email provider such as Resend          | Pending state, tokens, activation, and per-email cooldown |
| High-impact verification      | SMS/OTP provider or payments           | Optional phone, payment, or manual-review checks          |
| IP access and cookies         | Convex HTTP or owned edge endpoints    | Trusted proxy handling and cookie wrappers                |

This design uses CAPTCHA as the primary abuse gate and multi-key server-side
controls as the fallback for unauthenticated mutation protection.
