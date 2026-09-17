# Coding rules and reuse map

This is the short, current map of the starter. Check here before creating a
component, hook, query helper, or another state mechanism. The longer design
notes are [`InfiniteScrollingSystemDesign.md`](./InfiniteScrollingSystemDesign.md) and
[`RateLimitingSystemDesign.md`](./RateLimitingSystemDesign.md).

## Choose the existing layer first

| Need                                   | Use                                                          |
| -------------------------------------- | ------------------------------------------------------------ |
| Primitive UI or accessible overlay     | `src/components/ui/<family>` and its `index.ts` barrel       |
| Browser-native progressive enhancement | `src/components/ui/native-components`                        |
| Repeated list/table state and chrome   | `DataList`, `DataTable`, `PaginatedData`, `InfiniteScroll`   |
| Repeated form and upload workflow      | `Form` plus `FieldConfig`                                    |
| Reactive component logic               | a `.svelte.ts` hook in `src/hooks` or `src/features/*/hooks` |
| Convex data                            | `useQuery`/`useMutation`, or the pagination hooks            |
| Pure shared logic/types/config         | `src/shared` (domain-neutral) or the owning feature          |
| Page-only composition                  | `src/components/pages` or the route itself                   |

Do not make a new abstraction for one caller. Promote it only after the same
mechanics are needed in a second feature.

Name non-obvious boolean expressions before branching. Collection work,
encoded checks such as duplicate detection, and multi-clause business rules
belong in a descriptive `const` used by the `if`; keep direct guards when the
condition is already self-explanatory, such as `if (!product)` or
`if (items.length === 0)`.

## Project shape and request flow

- `src/routes` owns URL structure, layouts, page composition, and server load.
  The root `+layout.server.ts` supplies `authState` and `currentUser`; the
  `(protected)` and `/admin` server layouts redirect before rendering.
- `src/features` owns a vertical capability (auth, search, filters,
  pagination, uploads, validations, products). Put feature-specific text,
  defaults, schemas, and types there.
- `src/components/ui` is the reusable design-system layer. `custom-components`
  compose primitives; `native-components` prefer platform APIs and lazy-load a
  shadcn fallback when support is missing.
- `src/convex` is the server boundary. The client calls generated references
  from `@convex/_generated/api`; it never sends an owner id, database field,
  index name, or predicate expression as authorization input.
- `src/shared` contains values imported by both browser and Convex (branding,
  feature contracts, schemas, and pure utilities). Keep secrets and server-only
  modules out of it.

## Page component decomposition

When creating or substantially changing a page, keep the route focused on data
loading, page-level state, and composition. Put its presentational pieces under
`src/components/pages/<page>` (for example, `admin/products`) using these
locations:

- Loading UI always lives in
  `src/components/pages/<page>/loading/<component-name>-loading.svelte` and is
  imported by the page or component that displays it.
- Markup rendered for each keyed list/table item always lives in
  `src/components/pages/<page>/<component-name>-item.svelte`; the owning
  `{#each}`/`DataList`/`DataTable` renders that item component.
- Page-header markup and logic always lives in
  `src/components/pages/<page>/<component-name>-header.svelte`.

Keep a function directly inside the component that alone uses it. Do not lift a
child-only function into the page and pass it back as a callback. Pass no props
when the child can obtain what it needs itself; otherwise pass only the values
the function actually depends on and implement the function in that child.
Promote a function to a shared hook or utility only when multiple components
genuinely use it.

For `DataList` and `DataTable` headers:

- Without an enclosing `Card`, render `<component-name>-header.svelte` through
  the component's `header` snippet.
- Inside an enclosing `Card`, render `<component-name>-header.svelte` directly
  above `DataList` or `DataTable`, not through its `header` snippet.

## Svelte 5 rules

- Runes mode is forced in `vite.config.ts`. Use `$state` for owned mutable UI
  state and `$derived`/`$derived.by` for synchronous, side-effect-free values.
- `.svelte.ts` files are reusable reactive logic. Call hooks during component
  initialization, return state through getters, and pass changing inputs as
  getter functions. Destructuring a returned getter or a reactive prop freezes
  the value.
- `$effect` is exceptional. It remains deliberately in
  `useCachedConvexQuery.svelte.ts`, `useConvexPagination.svelte.ts`, the My Orders
  page only for external synchronization without
  a `useQuery` success callback, not derived state. Do not use effects for
  calculations, debouncing, URL writes, or state mirroring when an event handler,
  `$derived`, `onMount`, or attachment works.
- Use `$state.snapshot` before passing a deeply reactive proxy to code that
  expects plain data (the form-change hook does this). Do not export a directly
  reassigned `$state` binding from a module; expose an object or functions.
- Type `$props()` and use snippets for composition. Prefer `{@render}` over
  legacy slots. Use `{#key}` only when a child must be recreated with fresh
  local state.
- DOM/global APIs belong behind `onMount`, event handlers, or `{@attach}`. Keep
  SSR-safe code free of `window`, `document`, `navigator`, and object URLs.

## UI primitives (`src/components/ui`)

Import from the family barrel and compose the exported parts. Single-part
families use named imports (`{ Button }`, `{ Input }`); multi-part families use
the namespace (`* as Card`, `* as Dialog`). `components.json` is the source of
truth: aliases are `@/components`, `@/utils`, and `@/hooks`, the theme CSS is
`src/routes/layout.css`, and the icon library is Lucide.

| Family                                   | Parts / use                                                                                                                                  |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Avatar                                   | `Avatar`, `AvatarImage`, `AvatarFallback`, `AvatarBadge`, `AvatarGroup`, `AvatarGroupCount` — faces and identity fallback                    |
| Badge / Button                           | statuses, compact actions, links, and variants                                                                                               |
| Breadcrumb                               | `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator`, `BreadcrumbEllipsis`            |
| Card                                     | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `CardAction`                                              |
| Field / Label                            | labelled form controls, descriptions, errors, sets, legends, and field groups                                                                |
| Input / Textarea / Checkbox / RadioGroup | native text, multiline, boolean, and single-choice controls                                                                                  |
| InputGroup                               | `InputGroup`, `InputGroupInput`, `InputGroupTextarea`, `InputGroupAddon`, `InputGroupButton`, `InputGroupText` — controls with icons/actions |
| InputOTP                                 | `InputOTP`, `InputOTPGroup`, `InputOTPSlot`, `InputOTPSeparator` — verification codes                                                        |
| Select                                   | grouped custom select, labels, items, scroll buttons, portals                                                                                |
| Pagination                               | pagination root/content/items/links/previous/next/ellipsis primitives                                                                        |
| Drawer / Sheet                           | modal bottom-sheet and side-panel composition                                                                                                |
| Sidebar                                  | full shadcn sidebar provider/root/content/menu/group/trigger pieces; used as native-sidebar fallback                                         |
| Tabs                                     | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`                                                                                             |
| Table                                    | `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`, `TableFooter`, `TableCaption`                                     |
| Empty / Separator                        | structured empty states and visual separators                                                                                                |
| Skeleton / Spinner / Progress            | loading placeholders, pending actions, progress indicators                                                                                   |
| Tooltip / Sonner                         | tooltip composition and the single app-wide toast mount                                                                                      |

Use semantic tokens (`bg-background`, `text-muted-foreground`,
`text-destructive`) and built-in variants before custom colors. Use `cn()` for
conditional classes, `gap-*` instead of `space-*`, and `size-*` for equal
width/height. Do not add manual overlay z-index or `dark:` color overrides.
Dialogs, sheets, drawers, tabs, grouped menu items, cards, avatars, alerts,
empty states, skeletons, badges, and buttons follow the shadcn composition
rules; every dialog-like surface has an accessible title.

## Custom UI components (`src/components/ui/custom-components`)

| Component                                                                                               | Use                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Section`                                                                                               | Full-width semantic band with centered width, horizontal padding, and vertical rhythm; `class` styles the band and `containerClass` styles the inner container. |
| `SvelteHead`                                                                                            | Page title, description, canonical URL, Open Graph/Twitter tags, robots, and escaped JSON-LD from `COMPANY_DATA`. Use once per page.                            |
| `Header`                                                                                                | Public/app header with Better Auth session, avatar menu, sign-in link, and logout.                                                                              |
| `TabsUrl`                                                                                               | Controlled shadcn tabs whose active value is stored in a URL search parameter (push history by default).                                                        |
| `LocalizedValue` / `BadgeLocalized`                                                                     | Resolve `value -> locale -> English -> raw value`; the latter wraps the result in a `Badge`.                                                                    |
| `Plural`                                                                                                | ICU `Intl.PluralRules` (`one`, `few`, `many`, `other`) for count labels.                                                                                        |
| `CopyValue`                                                                                             | Clipboard copy button with truncated value, live confirmation, and timer cleanup.                                                                               |
| `EmailInput` / `PasswordInput`                                                                          | InputGroup wrappers with email-domain suggestion and password visibility toggle.                                                                                |
| `EmptyData` / `ErrorComponent`                                                                          | Standard empty state (optional card/icon/action) and safe retry error block.                                                                                    |
| `PaginatedData`                                                                                         | Presentational previous/next controls and page/total label; cursor state stays in the hook.                                                                     |
| `DataList`                                                                                              | Generic `<ul>` harness for page pagination or infinite scrolling; accepts header, row, loading, error, empty, and key snippets.                                 |
| `DataTable`                                                                                             | Generic table harness for page pagination, optional row selection, selection actions, custom head/row/loading/error/empty snippets.                             |
| `DataTableItem` / `DataTableSelectionBar` / `DataTableItemsLoading`                                     | Internal row selection behavior, bulk-action bar, and table/list skeleton rows.                                                                                 |
| `InfiniteScroll`                                                                                        | IntersectionObserver attachment plus accessible loading, retry, load-more button, and end states; it does not know Convex.                                      |
| `Form`                                                                                                  | Generic Convex mutation/action form driven by `FieldConfig`; owns validation, pending state, toast handling, R2 uploads, and optional `captchaAction`.          |
| `CaptchaField`                                                                                          | CAPTCHA feature field; `Form` renders it automatically when `captchaAction` is set, while native forms compose it directly with `useCaptcha`.                   |
| `FormField`, `FormInput`, `FormTextarea`, `FormSelect`, `FormCheckbox`, `FormSection`, `FormUploadFile` | `Form` field renderer pieces. Add a `custom` field/snippet before creating another form component.                                                              |
| `StaticImage`                                                                                           | Normal `<img>` prop forwarding with every non-empty `src` passed through `$app/paths.asset`; use for site-relative static assets.                               |

## Native-first components (`src/components/ui/native-components`)

These are the preferred wrappers when the browser has a suitable platform
primitive. Fallback files are implementation details and should not be
imported directly.

| Component                                                             | Native path and fallback                                                                                                        |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `NativeAvatar`                                                        | Image with initials fallback; use for user identity wherever a face may be missing.                                             |
| `NativeDialog`                                                        | Native modal `<dialog>` with `showModal`, explicit close snippets, focus/backdrop behavior, and no click-outside/Esc dismissal. |
| `NativePopover`                                                       | Popover API + CSS anchor positioning; light-dismiss and Esc are browser-owned.                                                  |
| `NativeSelect`                                                        | Styled native `<select>` when `appearance: base-select` is supported; otherwise shadcn `Select`.                                |
| `NativeSheet` (`NativeSheetFallback`)                                 | Native dialog command API and discrete slide transition; otherwise shadcn `Sheet`.                                              |
| `NativeTooltip` (`NativeTooltipFallback`)                             | Interest Invoker + Popover APIs; otherwise lazy-loaded shadcn `Tooltip`.                                                        |
| `NativeSidebar` (`NativeSidebarFallback`)                             | Desktop `<details>` disclosure and mobile shadcn `Sheet`; unsupported desktop browsers lazy-load shadcn `Sidebar`.              |
| `NativeSidebarContent` / `NativeSidebarSection` / `NativeSidebarLink` | Main-content spacing, labelled sidebar groups, and active nested-route links via `usePathname`.                                 |
| `NativeSidebarPageHeader`                                             | Mobile sidebar trigger plus route-id/parameter-aware breadcrumbs.                                                               |
| `NativeSidebarUser`                                                   | Session-aware account trigger/popover and logout action.                                                                        |

## Feature components and hooks

| Area             | Existing pieces and intended use                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth             | `SignInForm`, `SignUpForm`, `ForgotPasswordForm`, `VerifyEmailForm`, and `LogoutButton`; `useAuth` centralizes Better Auth calls, error codes, pending state, OTP/password/social flows, and redirects. Keep wording in components via `ERROR_MESSAGES`.                                                                                                                                                          |
| Search           | `SearchInput` is an InputGroup with clear button and optional listbox snippet. `useSearch` owns raw value, debounce, trim, minimum two-character gate, and `state`/`url` mode. Pass only `search.term` to a query.                                                                                                                                                                                                |
| Filters          | `ADMIN_USERS_FILTER_DEFS` defines symbolic options. `useFilters` owns state/URL mode, active values, count, clear methods, and stable `identity`.                                                                                                                                                                                                                                                                 |
| Pagination       | `useConvexPagination` owns page/cursor sessions; `useConvexInfinitePagination` owns accumulated pages, duplicate protection, retry, and reset. `createConvexPaginationQuery` is their shared subscription builder.                                                                                                                                                                                                |
| Uploads          | `UploadFile`, `UploadFileDropzone`, `UploadFilePreviewItem`, and `useUpload` manage previews, object-URL cleanup, multiple-file ordering, cover selection, and removal. `optimizeToWebp` is the browser compression step.                                                                                                                                                                                         |
| Validation       | `validationsData` and `toHumanMessage` map validator text to safe UI copy.                                                                                                                                                                                                                                                                                                                                        |
| Product variants | `ProductVariantsEditor` (with option input, variant row, add buttons) edits `ProductVariantFormValue` rows bound from the product forms; `ProductVariantDiscountCalculator` applies bulk discounts; `getProductVariantRowErrors` is the live row validation; `getProductVariantAvailability` and the shared `getProductVariantLabel`/`getProductVariantOptionKey` utilities serve the storefront picker and cart. |

The admin page components are intentionally page-specific: user list/header
rows, user profile/settings/sessions/logs tabs, ban/unban/role actions, and
their loading skeletons. Reuse the generic `DataList`, `DataTable`, `Card`,
`Badge`, `NativeDialog`, `NativeSelect`, and query hooks inside new admin
screens instead of copying those page components.

## Shared hooks, state, and utilities

Operation input schemas use the exact function name plus `Schema`, such as
`saveProductSchema` and `updateCategorySchema`. Reusable data schemas keep
descriptive names such as `productVariantSetSchema`.

Leave built-in Zod validation messages at their defaults. Custom refinements
must emit stable uppercase codes,
never hardcoded user-facing text. Map those codes in `validationsData.ts` to
`ValidationMessages` translations and display Zod issues through the existing
`toHumanMessage` helper. Keep translation imports out of shared schemas.

- `useSearchParams` owns only declared URL keys, preserves all other query
  parameters/path/hash, supports replace/push history, and exposes popstate
  cleanup. Use it instead of hand-building query strings.
- `usePathname` normalizes trailing slashes and matches exact or nested paths.
- `useFormChanges` snapshots initial values, exposes reactive `values`,
  `isDirty`, and `changedValues` for edit forms.
- `useSelectable` is the shared `SvelteSet` row-selection state behind
  `DataTable`; provide a stable item key when indexes can change.
- `useCachedConvexQuery` displays the last successful snapshot while a query
  reconnects. `convexQueryCache` is a bounded 50-entry LRU and is cleared on
  logout. `cacheQuery` is a separate generic cache for retaining SvelteKit
  `query()` proxies; it is not a Convex refresh mechanism.
- `IsMobile` is the `MediaQuery` class used by responsive native/sidebar code.
- `cn`, element-ref/child types, `toastMessage`, date formatters, initials,
  UTF-8 base64 helpers, HTML escaping, and error-code mapping already live in
  `src/utils` or `src/shared/utils`; reuse them before adding equivalents.
- `COMPANY_DATA` is the branding source for UI, emails, JSON-LD, and links.
  `pageEndpoints.ts` uses `resolve()` so links survive a non-root base path.
- Use the custom `Link` component for internal website links so `localizeHref`
  is applied explicitly; use a normal `<a>` for external links.
- Use `gotoParaglide(...)` from `src/utils/gotoParaglide.ts` for programmatic
  internal navigation instead of importing `goto` directly from
  `$app/navigation`.

State choice: local interaction state uses `$state`; computed state uses
`$derived`; shareable/searchable state uses URL mode; server truth uses a live
Convex query. Convex subscriptions are independent: three `useQuery` calls may
render as each resolves unless the page deliberately combines their loading
flags or waits on `Promise.all`.

## Convex data model and function surface

`src/convex/schema.ts` owns app tables:

- `categories`: flat storefront taxonomy referenced by required
  `products.categoryId`.
- `products`: catalog name, slug, description, one category, an image library
  (`imageKeys`/`images`; covers for listings, upsells, and OG tags use its first
  image), status, `productVariantOptionNames`, and display caches
  (`priceInCents` is the lowest product variant price, `hasPriceRange`, and a
  shared `compareAtPriceInCents` when every product variant matches).
  `saveProduct` creates or edits product details, product variants, and the
  display caches in one transaction; new products default to draft and always
  have at least one product variant. Publishing requires an active category.
- `productVariants`: `productId`, `position`, structured `options`
  (`name`/`value`), a catalog-unique `sku`, an ordered `imageKeys` assignment
  from the product library (first = primary, rejected if it references a key
  outside the library), `priceInCents`, `compareAtPriceInCents`, `inventory`,
  and `reservedInventory`. Indexed by `by_product_id` and `by_sku`. Product
  variant rows are the only price and stock source; backend code for them lives
  under `src/convex/tables/productVariants`. The storefront gallery, cart line
  images, and checkout snapshots use the selected variant's images with the
  product library as fallback. One product's variants are always read with
  async iteration through `by_product_id` (never `.collect()`), and deleting a
  product queues bounded scheduled batches for its variants.
- Upsells use an optional, ordered `products.upsellProductIds` array (maximum four).
  `/admin/upsells` manages recommendations through `tables/upsells` admin queries
  and `saveProductUpsells`; the public query returns only active recommendations
  for active source products. Shared config and validation live in
  `src/shared/features/upsells`. Saving updates only recommendations and logs the
  admin action, without sending email. See `UpsellsSystemDesign.md`.
- `storageUploads`: owner, object key, `pending`/`uploaded` status, timestamp,
  and key/created-at indexes. It tracks uploads until a mutation claims them.
- Better Auth owns its component tables (`user`, `session`, `account`,
  `verification`, rate-limit/JWKS tables) under `betterAuth/component`.

Always use Convex's generated `Doc<'table'>` type from
`src/convex/_generated/dataModel` for Convex documents across the client,
server, components, hooks, and tests. Do not derive document types with
`FunctionReturnType<...>['items'][number]`; reserve `FunctionReturnType` for
query-specific response envelopes or intentionally enriched response types,
intersecting those with `Doc<'table'>` when needed.

Use the custom builders in `convexFunctionBuilders.ts`:

- `authenticatedQuery`, `authenticatedMutation`, and `authenticatedAction`
  require identity, apply actor rate limits where relevant, and expose the
  verified `ctx.identity`.
- `adminQuery`/`adminMutation` require `identity.role === 'admin'`.
- `mutation`/`action` are deliberate public entry points with rate limiting;
  `internalMutation` is for trusted scheduled/helper writes.
- `authenticatedUploadMutation` additionally validates caller-owned uploaded
  keys and removes claimed upload records on success.

Current app-facing functions are:

- `api.auth.getCurrentUser`;
- public product listing/detail queries;
- admin product listing/detail, product saving, and deletion restricted to drafts;
- `api.storage.r2.generateUploadUrl`, `syncMetadata`, and `deleteObject`;
- `api.search.queries.fetchSearchSuggestions` (public, normalized, minimum two
  characters, max seven results);
- admin users/profile/settings/sessions/logs queries and
  `api.auditLogs.queries.fetchAuditLogsAdmin`.
- Checkout opens Stripe through `api.stripe.actions.createStripeCheckout`.
  Its internal preparation query validates active products and product variant
  prices without writing an order or draft. Stripe stores customer metadata and
  immutable line prices; only the verified paid webhook calls the internal
  `completeCheckoutReservation` mutation. Session and Payment Intent indexes
  prevent duplicate orders from webhook retries.
  Each submission creates a fresh Stripe Session, without checkout retry tracking.
  The receipt uses a server-generated random `receiptToken` solely as a guest access token.
  Mounting a paid receipt saves guest access; the first return from Stripe clears
  the current cart. No pre-payment cart snapshot is stored.

For list queries, use `fetchOptimizedQuery`: it adds validated pagination,
search, and symbolic filters, chooses the feature predicate registry, delegates
the indexed page fetch, and reads an aggregate/counter total when configured.
Use `fetchOptimizedSearchQuery` for bounded suggestions. Keep cursors opaque.

The add and edit forms save content/category/images/product variants through
`saveProduct`. Catalog edits use last-save-wins. Product variant prices and stock
are stored as integer cents and units on `productVariants`; the product-level
price fields are display caches only. Cart lines are keyed by `productVariantId`;
`api.tables.productVariants.queries.fetchCart` resolves live product variant
prices and availability for the cart and checkout summary. Storefront listings
read one bounded product-variant summary per page item for availability and use
the denormalized price cache for prices.

`orders` stores customer, fulfillment, trusted totals, payment/fulfillment state,
and guest receipt access; `orderItems` stores immutable product name, product
variant label, SKU, price, and quantity snapshots. Never render order history
from live catalog joins or cascade-delete orders/items with products. Stripe
Checkout payment state comes only from verified webhook events.

Counts and side effects already have homes: product and user totals use
aggregates, and trigger-wrapped mutations keep these projections current.
Audit events are scheduled through internal mutations; R2 abandoned-upload
cleanup runs every five minutes with a bounded batch. Resend email rendering
and OTP delivery stay server-side. Migrations use the shared
`@convex-dev/migrations` registry and idempotent table-specific definitions.

Convex rules: every function has argument and return validators; derive owner
scope from identity; check ownership on every read/update/delete; use indexes
and bounded pagination; use `ConvexError` for safe expected failures; do not
scan for routine totals or expose raw infrastructure errors. Read the generated
`src/convex/_generated/ai/guidelines.md` before changing Convex code.

For backend outcomes, return the result directly when an operation succeeds;
do not add a redundant `{ success: true }` wrapper to routine CRUD functions.
Throw `ConvexError` for expected, client-safe failures that must abort and roll
back the transaction, such as invalid input, forbidden access, conflicts, or a
missing document. Throw `Error` for unexpected bugs, broken invariants,
misconfiguration, and infrastructure failures. Return `typesBackendResult`
only when failure is a normal business outcome the caller is expected to branch
on. A returned `{ success: false }` does not roll back prior mutation writes, so
return it only before any writes or when committing those writes is intentional.

### Translatable backend errors

Convex must return structured data, never translated text. For every new
expected client-facing failure:

1. Add its discriminated payload to `backendErrorDataSchema` in
   `src/shared/types/types.ts`. Keep `code` stable and uppercase; add structured
   values such as `maxFiles` when the message needs interpolation.
2. Throw the typed payload from Convex:

   ```ts
   throw new ConvexError<BackendErrorData>({
   	code: 'TOO_MANY_FILES',
   	maxFiles: STORAGE_CONFIG.maxFilesPerUpload
   });
   ```

   Import `BackendErrorData` with `import type`, so Convex does not bundle the
   frontend parser or Paraglide. Do not put English text or translation keys in
   the error payload.

3. Add the user-facing text under `BackendMessages` in `messages/en.json`.
4. Add the matching exhaustive case in
   `src/utils/getBackendErrorMessage.ts`, passing any structured payload values
   to the Paraglide message.

No form or button needs its own code mapping. All caught mutation errors should
continue through `toastMessage({ type: 'error', error, message: fallback })`.
`toastMessage` handles rate limits first, translates recognized validated
`ConvexError` payloads centrally, and uses the caller's safe fallback for an
unknown code, malformed payload, ordinary `Error`, or infrastructure failure.

## Routes and page patterns

- `/` is the public home page.
- `(app)/(unprotected)` contains the shop, product detail, cart checkout,
  sign-in, sign-up, verify-email, and forgot-password screens.
- `(app)/(protected)` is reserved for future authenticated storefront pages;
  its server layout owns the authentication redirect.
- `/admin` contains users, audit logs, and user detail tabs; its server layout
  owns both authentication and admin-role redirects.
- `/api/auth/[...all]` is the Better Auth HTTP handler. `hooks.server.ts`
  injects the Convex token and sanitizes unexpected/validation errors.

Pages should compose existing loading/error/empty states, use `SvelteHead`, and
keep each Convex query's loading/error branch local. Use SvelteKit server
`load` only for request-scoped SSR data or guards; current browser Convex calls
are live subscriptions, not SvelteKit stream responses.

## Accessibility, imports, and verification

- Use semantic HTML (`button`, `a`, `form`, `ul`, `table`, `dialog`), stable
  labels, keyboard access, `aria-current`, `aria-busy`, `role="status"`/`alert`,
  and visible focus styles. Icon-only controls need an accessible label.
- Keep user-facing messages in the calling component; use `toastMessage` only
  to route success/error presentation and rate-limit timing.
- Translation keys in page child components use the PageName.ComponentName.key
  namespace; page-owned route markup uses PageName.key.
- Group imports with uppercase comments (`// SVELTEKIT IMPORTS`, `// LIBRARIES`,
  `// COMPONENTS`, `// CONFIG`, `// UTILS`, `// TYPES`) and keep framework/
  library imports above local modules. Prefer `.js` suffixes for local TS
  imports and the `@/`/`@convex` aliases. Normalize old direct default
  primitive imports to barrel named imports when touching that file.
- After every change run `bunx --bun oxlint`. For Convex or pagination changes,
  also run `bun run check` and `npx convex dev --once`; run
  `bun run test:convex` for the relevant behavior.
