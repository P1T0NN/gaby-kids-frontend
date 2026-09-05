# Convex Audit Log

## Purpose

An audit log is a record of meaningful actions:

> Who did what, to which resource, when, and with what result?

Use it for accountability, security investigations, and compliance-style history. It is not a replacement for normal application data, debugging logs, analytics, or rate limiting.

This project uses `convex-audit-log` for product and category audit history, exposed to administrators through `/admin/logs`.

## When to use which API

| API                  | Use it when                                                   | Typical examples                                        |
| -------------------- | ------------------------------------------------------------- | ------------------------------------------------------- |
| `auditLog.log`       | An important event does not need before/after document state  | Login, logout, export, role change, unauthorized access |
| `auditLog.logChange` | A resource was changed and the old and new safe state matters | Product edited, user profile changed, settings updated  |
| `auditLog.logBulk`   | Several related events should be recorded together            | Importing many records, a batch permission update       |
| `queryByResource`    | Showing the history of one resource                           | “Who changed this product?”                             |
| `queryByActor`       | Showing one user’s activity                                   | Admin activity review                                   |
| `queryBySeverity`    | Reviewing warnings or security events                         | Failed operations, suspicious actions                   |
| `queryByAction`      | Reviewing one event type                                      | All role changes or deletions                           |
| `search`             | An investigation needs multiple filters                       | Actor + action + severity + date range                  |
| `watchCritical`      | An admin/security screen needs recent critical events         | Unauthorized access or breach monitoring                |
| `getStats`           | An admin dashboard needs counts and top actions               | Events by severity, action, or actor                    |
| `detectAnomalies`    | Simple frequency thresholds are enough                        | More than 5 failed logins in 5 minutes                  |
| `generateReport`     | Logs must be exported for review or compliance                | JSON/CSV monthly report                                 |
| `cleanup`            | Old events should be removed according to retention rules     | Delete ordinary logs after 90 days                      |

## What belongs in the audit log

Log actions where a future administrator, support engineer, or auditor may need an answer:

- User or admin role and permission changes
- Account creation, deletion, password changes, and MFA changes
- Product creation, meaningful edits, deletion, and export
- Settings changes
- File deletion or sensitive data export
- Failed or unauthorized access attempts
- Important background/system actions

For this ecommerce app, a sensible first set would be:

| Event                          | API         | Severity                |
| ------------------------------ | ----------- | ----------------------- |
| Product created                | `log`       | `info`                  |
| Product updated                | `logChange` | `info`                  |
| Product deleted                | `log`       | `warning`               |
| Admin role changed             | `log`       | `warning`               |
| Unauthorized admin access      | `log`       | `critical`              |
| Repeated failed authentication | `log`       | `warning` or `critical` |

Do not log every query, render, keystroke, or ordinary page visit unless access logging is specifically required. Those events create noise and storage cost. Use analytics or regular application logs for telemetry and debugging.

## Retention policy

The daily Convex cron deletes `info`, `warning`, and `error` events after 90 days. It preserves `critical` events indefinitely.

- Current record creation and update events are `info`.
- Current product and category deletion events are `warning`.
- Reserve `critical` for events that must survive routine cleanup, such as unauthorized administrative access, account deletion, role or permission changes, and audit-retention changes.

Do not mark ordinary events as `critical` merely to keep more history. Permanent retention increases privacy and storage obligations; use a finite policy instead when legal or product requirements specify one.

## Choosing event fields

### `action`

Use a stable, searchable event name such as:

- `record.created`
- `record.updated`
- `record.deleted`
- `user.role.changed`
- `security.unauthorized_access`

Use the exported `AuditActions` constants where they fit. Add a project-specific action when the predefined names are too broad.

### `actorId`

Derive the actor on the server from the authenticated identity. Never accept the actor ID as a trusted client argument.

For this project, use the Better Auth user ID:

```ts
const identity = await requireIdentity(ctx);

await auditLog.log(ctx, {
	actorId: identity.subject,
	action: 'record.deleted',
	resourceType: 'products',
	resourceId: productId,
	severity: 'warning'
});
```

Use a `null`/omitted actor only for a genuinely system-generated event. If anonymous events matter, record a separate trusted request identifier rather than pretending there is a user actor.

### `resourceType` and `resourceId`

Use these together to identify the affected entity:

```ts
resourceType: 'products',
resourceId: productId
```

This is what makes `queryByResource` useful for a resource history page.

### `before` and `after`

Use `logChange` for a safe, intentionally selected snapshot—not necessarily the entire database document:

```ts
await auditLog.logChange(ctx, {
	action: 'record.updated',
	actorId: identity.subject,
	resourceType: 'products',
	resourceId: productId,
	before: { name: product.name, price: product.price },
	after: { name: args.name, price: args.price },
	generateDiff: true,
	severity: 'info'
});
```

Never put passwords, session tokens, API keys, raw authentication claims, or private file contents into `metadata`, `before`, or `after`. Configure PII field redaction for fields such as email and phone, but still avoid logging secrets in the first place.

## Where to add logging

### Convex mutations

Add audit calls in trusted server-side Convex mutations, after authorization has succeeded and alongside the business operation. The mutation should determine the actor and resource itself.

For an update, read the old safe state, perform the update, then log the selected before/after state. For a delete, capture only the safe identifiers or summary needed for history before deleting.

Decide how your product should behave if the audit write fails:

- For ordinary product history, the main operation may be allowed to continue.
- For a compliance requirement, the operation may need to fail unless the audit event is recorded.

### Better Auth events

Login, logout, password reset, and failed authentication may happen through Better Auth handlers rather than your normal product mutations. They need explicit Better Auth hook/event integration. Installing the component does not automatically discover every Better Auth event.

### Admin audit screens

Queries that expose logs must be protected separately. An authenticated user should not automatically be able to search every actor’s activity. Use the project’s admin authorization helper before exposing global audit queries.

The React hooks in the component README are not directly usable in this Svelte project. Expose only the server queries we need and consume them with the project’s Svelte/Convex query helpers.

## What not to use it for

| Need                                        | Use instead                                              |
| ------------------------------------------- | -------------------------------------------------------- |
| Per-user request throttling                 | The existing rate-limiter component                      |
| Product metrics, funnels, or page telemetry | Analytics                                                |
| Current product state                       | The `products` table                                     |
| Debugging stack traces                      | Application/server logging                               |
| Durable workflows or retries                | A workflow/job component                                 |
| User-facing activity feed only              | A purpose-built activity table if its semantics differ   |
| Tamper-proof legal evidence                 | A dedicated immutable/WORM or externally archived system |

## Reference locations

### Official listing

- [Convex Audit Log component page](https://www.convex.dev/components/convex-audit-log)

This gives the high-level feature list and links to the package, source repository, demo, and README.

### Linked source repository

- [Repository README](https://github.com/robertalv/audit-log)
- [Client wrapper and API methods](https://raw.githubusercontent.com/robertalv/audit-log/main/src/client/index.ts)
- [Component functions](https://raw.githubusercontent.com/robertalv/audit-log/main/src/component/lib.ts)
- [Component schema and indexes](https://raw.githubusercontent.com/robertalv/audit-log/main/src/component/schema.ts)

Check the source when the README and marketing description are ambiguous. In particular:

- The client wrapper performs the PII redaction and forwards calls to component mutations.
- `detectAnomalies` is frequency-threshold detection, not general machine-learning anomaly detection.
- Queries and admin operations still need application-level authorization.
- Cleanup can delete old events, so this is not automatically a permanent or tamper-proof ledger.

### Project-specific references

- [Authentication helper](../../src/convex/betterAuth/helpers/requireIdentity.ts) — authenticated identity and `identity.subject`
- [Admin route guard](../../src/routes/admin/+layout.server.ts) — server-side admin authorization
- [Convex function builders](../../src/convex/builders/convexFunctionBuilders.ts) — authenticated mutation/query boundaries
- [Rate-limit helper](../../src/convex/rateLimits/helpers/enforceRateLimit.ts) — existing throttling; do not duplicate it with audit logging

The project currently pins `convex-audit-log` at compatible version `0.2.x` and Convex at `1.45.x`.

## Short decision rule

Use Audit Log when the question is:

> “Who changed or accessed this important thing, and what happened?”

Do not use it when the question is:

> “How is the app performing?” or “How often may this user call this endpoint?”
