# TODO

## Codebase audit (fallow)

Findings from `fallow dead-code`, `fallow dupes`, and `fallow health`.
`.fallowrc.json` excludes shadcn components (`src/components/ui/<component>/**`),
Convex `_generated`, and the bundled `tools/oxlint/anti-slop/index.js` from
dead-code and duplicate reporting, while their imports still count for
dependency analysis.

### Done in this audit

- [x] `@iconify-json/lucide` is **required**: `@iconify/tailwind4` resolves the
      lucide icon classes (100+ usages) from it. It is never imported in JS,
      so it now lives in `devDependencies` + `ignoreDependencies` instead. Verified
      the built CSS contains all lucide icon definitions.
- [x] Moved 11 runtime deps from `devDependencies` to `dependencies`:
      `bits-ui`, `@lucide/svelte`, `clsx`, `tailwind-merge`, `tailwind-variants`,
      `embla-carousel-svelte`, `mode-watcher`, `svelte-sonner`, `shadcn-svelte`,
      `@fontsource-variable/inter`, `@iconify/tailwind4`.
- [x] Fixed `.fallowrc.json`: `duplicates.ignore`, `ignoreUnresolvedImports`
      (85 false positives from `@convex/_generated/*`), `ignoreExports`
      (shadcn barrel `duplicate-exports`), shadcn rule overrides,
      `ignoreDependencies` for the icon collection.
- [x] Removed dead types `FormValues`, `ConvexPageResult`, `ConvexFetchPage`,
      `CountFiltered`; wired `ExtraFields` into `form.svelte` (was duplicated inline).
- [x] Confirmed `typesBackendResult` stays: documented convention in
      `docs/CodingRules.md:329` (non-aborting business failures).
- [x] Confirmed `rows` prop on `data-table-items-loading.svelte` is a false positive
      (used at line 24).
- [x] Wired `category-options.svelte` into the shop: added a URL-backed `category`
      FilterDef to `SHOP_PRODUCT_FILTER_DEFS` and rendered `CategoryOptions` for it
      in `shop-products-header.svelte` (dynamic options stay query-owned).
- [x] Removed `src/shared/lib/convexHttpClient.server.ts` — superseded by
      `createConvexHttpClient` from `@mmailaender/convex-better-auth-svelte/sveltekit`.

### Dead code — unused files (verified against intent)

Checked each against `docs/CodingRules.md`, the live code, and the template goal:
documented/reusable capabilities stay, superseded leftovers go.
Current state: **10 unused files** — all deliberately kept below.

**Keep — documented template surface**

- [x] `native-tooltip.svelte` + `native-tooltip-fallback.svelte` — `CodingRules.md:173`;
      the fallback is an intentional lazy-loaded implementation detail.
- [x] `static-image.svelte` — `CodingRules.md:158`.
- [x] `base64.ts` — `CodingRules.md:222` ("UTF-8 base64 helpers … reuse them").
- [x] Infinite-pagination cluster (6 files: `useConvexInfinitePagination`,
      `applyInfinitePage`, `loadMore`, `retryPagination`,
      `appendUniquePaginationItems`, `pageHasMore`) — `CodingRules.md:186`;
      infinite scrolling stays.

**Keep — reuse tooling (explicit decision)**

- [x] `commonPredicatesConvex.ts` — shared predicate factories. Adopted:
      `buildProductFilter` uses `eqColumn('category')`; `buildOrderFilter` maps its
      value whitelists through `eqMap`. `numberBuckets`/`dateBuckets` are marked
      `@expected-unused` (reserved for future range/date facets; fallow tracks them
      for staleness).

**Wired (done)**

- [x] `breadcrumb-display.svelte` — `native-sidebar-page-header.svelte` now renders
      `BreadcrumbDisplay` instead of carrying its own copy of the logic and markup;
      the 19-line clone group is gone.

**Removed (done)**

- [x] `src/components/ui/custom-components/form/index.ts` — the only barrel in the
      component tree; all consumers import direct paths.
- [x] `src/features/cart/components/cart/cart-footer.svelte` — superseded by
      `cart.svelte:87-109`'s richer inline footer.
- [x] `src/shared/features/auth/emails/sendOtpEmail.ts` — duplicate of the live Convex
      `betterAuth/helpers/sendOtpEmail.ts`. Also removed the now-unused `resend` npm
      dependency (the Convex path uses `@convex-dev/resend`).

### Dead code — 5 unused exports

All remaining findings are the deliberate infinite-pagination keeps
(`applyInfinitePage`, `loadMore`, `retryPagination`, `appendUniquePaginationItems`,
`pageHasMore`).

Reviewed and cleared in this pass:

- [x] `authClient.ts` — removed the redundant `signIn`/`signUp`/`useSession` shortcuts
      (and a duplicated comment); consumers use the exported `authClient` instance, as
      `useAuth` already does.
- [x] `getChangedValues` (used by `useFormChanges`) and `isActivePath` (used by
      `usePathname`) — kept as reusable helpers; enabled
      `ignoreExportsUsedInFile: true` so in-file use is not reported as dead.
- [x] `handleValidationError` (`hooks.server.ts`) — framework-invoked SvelteKit hook;
      marked `@expected-unused`.
- [x] `cacheQuery` (`clientCache.ts`) — documented generic helper (`CodingRules.md`);
      marked `@expected-unused`.
- [x] `isPopulatedObjectExpression` (anti-slop plugin) — dead even in-file, superseded
      by `isKnownEvidenceExpression`; removed.

### Duplicate export — 1 — done

- [x] `open` exported from both `src/components/ui/native-components/native-dialog/native-dialog.svelte`
      and `src/features/upsells/components/upsells-dialog/upsells-dialog.svelte` — intentional
      (both dialogs expose a programmatic `open()`), so both files were added to
      `ignoreExports` in `.fallowrc.json`. `duplicate_exports` is now 0.

## Duplicate code (`fallow dupes`)

11 clone groups / 1.73% duplication (443 duplicated lines, 28 instances).
Excludes shadcn, Convex generated code, and the bundled oxlint plugin.
Remaining groups: 6 in the vendored `tools/oxlint/anti-slop/**`, 3 across the
`betterAuth/component` boundary, and the 2 marginal prop-block matches noted in P7.

### Priority 1 — Product form fields (57 + 14 lines) — done

Extracted `src/features/products/forms/createProductForm.ts` (mirrors the
`features/checkout/forms/createCheckoutForm.ts` convention) exporting:

- `createProductFields({ discountField, categoryField, inventoryMin, inventoryDisabled })`
- `buildSaveProductArgs({ values, categoryId, id? })` typed as
  `PreparedMutationArgs<SaveProductMutation>`

- [x] Extract `createProductFields()` into a shared products form module.
- [x] Extract `buildSaveProductArgs()` (the `prepareArgs` body).
- [x] Reuse in `admin-edit-product-form.svelte` and `add-product/+page.svelte`
      (−248/+23 lines across both; clone groups gone).

### Priority 2 — Auth forms (21 + 14 + 14 + 11 + 8 lines) — done

Extracted:

- `src/features/auth/components/auth-form-shell/auth-form-shell.svelte` — Card shell,
  header, form, captcha field, error paragraph, submit button (+ optional Google
  button and `actionsFooter` snippet), plus optional `footer` snippet. Fields are
  passed via `children`.
- `src/features/auth/components/otp-field/otp-field.svelte` — the duplicated OTP
  input block.

`useCaptcha.svelte.ts` now exports `CaptchaApi` so the shell can take the hook object
as a prop. The shell's `submitDisabled` prop absorbs the form-specific guards
(e.g. `otp.length < 6`). Fields are passed as direct content (not an explicit
parameterless `{#snippet children()}`), which ESLint's
`svelte/no-useless-children-snippet` requires.

- [x] Extract `AuthFormShell`.
- [x] Refactor `sign-in-form`, `sign-up-form`, `forgot-password-form`, `verify-email-form`.
- [x] Ported the same change to `svelte-convex-starter` (hardcoded copy +
      `ERROR_MESSAGES`) and `svelte-convex-starter-i18n` (paraglide +
      `ERROR_MESSAGE_KEYS`), both verified with svelte-check/build.

### Priority 3 — Order summaries (16 + 13 + 10 lines) — done

Extracted into `src/features/orders/components/` (flat-file convention of that feature):

- `order-line-items.svelte` — item rows + subtotal/total `<dl>`. Labels are props
  (`quantityLabel` as a `(quantity) => string`, `subtotalLabel`, `totalLabel`) so each
  page keeps its own message namespace; no message-file changes needed.
- `order-shipping-address.svelte` — owns the `{#if address}` grid block.

- [x] Extract shared `OrderLineItems` (quantity/price rows).
- [x] Extract shared `OrderShippingAddress`.
- [x] Reuse in `CheckoutSuccessOrderSummary.svelte`,
      `CheckoutSuccessOrderDetails.svelte`, `admin-edit-order-summary.svelte`.

Note: the admin totals now use `tabular-nums` (matching the checkout and the rest of
the codebase's price rendering); everything else renders identically.

### Priority 4 — data-list ↔ data-table (12 + 12 + 11 + 10 lines) — done

Extracted into `src/components/ui/custom-components/`:

- `data-pagination/data-pagination.svelte` — adapts `PaginationState` to the
  presentational `PaginatedData` primitive (page/cursor/total/pageSize/loading/
  onPrev/onNext), with the `total` override. Replaces the 4 identical 8-line blocks
  (data-list used it twice).
- `data-empty-state/data-empty-state.svelte` — the standard DataList/DataTable empty
  state (`EmptyData` + the inbox icon), so the block is defined once.

- [x] Extract `DataPagination` (data-list repeats it internally too).
- [x] Reuse the `EmptyData` block instead of re-rendering it.
- [x] Reuse in `data-list.svelte` and `data-table.svelte`.
- [x] Ported to `svelte-convex-starter` and `svelte-convex-starter-i18n` (same
      components and duplication there).
- [x] Also removed a pre-existing unused `Button` import in
      `custom-components/header/header.svelte` (ESLint `no-unused-vars`).

### Priority 5 — Admin table items (14 + 11 lines) — done (ecommerce only)

Scope note: this one is ecommerce-only — the starter projects have no categories/products
admin pages. Their closest pattern (todo/tests delete dialogs) is a different action-row
shape (`type="submit"`, different spacing), so nothing was ported.

Extracted into `src/components/ui/custom-components/`:

- `confirm-dialog-actions/confirm-dialog-actions.svelte` — the Cancel + destructive
  confirm row with the pending spinner (`pending` disables both and shows the spinner).
  Extended with `confirmType?: 'button' | 'submit'` and `confirmDisabled` so it also
  covers the danger-zone/ban dialogs (submit + type-to-confirm), and now shared with the
  two starters.
- `destructive-menu-item/destructive-menu-item.svelte` — the destructive popover menu
  item (ghost, trash icon, destructive hover).

- [x] Extract the destructive-action button + `pendingAction` block.
- [x] Reuse in `admin-categories-table-item.svelte` and `admin-products-table-item.svelte`.

### Priority 6 — Order headers + filter defs (13 + 5 + 15 lines) — done

Extracted:

- `src/components/ui/custom-components/filter-bar/filter-bar.svelte` — the filter loop
  - clear button (`filters`, `idPrefix`, `clearLabel`). Used by `my-orders-header.svelte`
    and `admin-orders-header.svelte`.
- `src/features/filters/data/orderFilterOptions.ts` — `paymentStatusOptions(allLabel)`
  and `fulfillmentStatusOptions(allLabel)` (the shared values + `OrdersFeature.*` badge
  labels); each page keeps its own "All …" copy. Used by `adminOrdersFilterDefs.ts` and
  `myOrdersFilterDefs.ts`.

Notes:

- `admin/users/+page.svelte` keeps its inline loop: it's a flat `flex` row of bare
  `NativeSelect`s (no `Field.Field`/label) with a `ghost` clear button, so it doesn't
  fit `FilterBar`.
- `fulfillmentMethod` options stay inline — their delivery/pickup copy is page-owned
  ("Pickup" vs "Pick up"), so a builder would add nothing.
- Drive-by: removed two pre-existing unused `{#each Array(n) as _, index (index)}`
  bindings in `my-orders/loading/*.svelte` (ESLint `no-unused-vars`).

- [x] Extract a shared list-header component.
- [x] Extract shared order filter definitions.

### Priority 7 — Remaining groups — done

Fixed (ecommerce):

- [x] Breadcrumb markup (19) — wired `breadcrumb-display.svelte` into
      `native-sidebar-page-header.svelte`; clone gone.
- [x] Upsell selected-item rows (12) — shared `features/upsells/components/upsell-product-summary.svelte`.
- [x] Email templates (10) — shared `convex/emails/helpers/orderEmailParts.ts` (total + item lines/rows).
- [x] Validators (10) — shared `convex/validators/pageValidator.ts` (global validators
      live in `convex/validators/`, not `utils/`); applied to the order, product,
      category, and upsell page validators.
- [x] Form internals (8 + 7 + 5 + 5) — `form/formControl.ts` (shared attrs + input
      forwarding) for `form-input`/`form-textarea`; local label/description snippets in
      `form-field.svelte`; `controlProps()` in `form.svelte`.
- [x] Single-file repeats — `admin-edit-order-fulfillment-status-button.svelte` now has one
      `updateFulfillment(close, action)`; `routes/admin/logs/+page.svelte` computes
      `resourceLabel` once per row (`{@const}`).
- [x] `convexFunctionBuilders.ts` ↔ `r2.ts` (7) — shared `convex/storage/getUploadByKey.ts`.
- [x] Also fixed two groups missed in the original list: the 37-line `runAction`
      duplicate in `admin-user-tabs-settings-danger-zone.svelte` ↔ `ban-user-dialog.svelte`
      (now `features/auth/lib/runAuthAction.ts`, which `useAuth` also uses for its result
      type) and the 11-line confirm-dialog body (new
      `custom-components/confirm-delete-dialog/confirm-delete-dialog.svelte`, used by the
      categories/products table items).

Left (deliberate):

- 9-line `OrderLineItems` prop block in the checkout/admin summaries — only the
  page-owned label props differ; a shared bundle would not remove real duplication.
- 5-line `FilterSelect` props between `filter-bar.svelte` and `admin/users/+page.svelte` —
  plain prop forwarding; the users page keeps its inline bare-`NativeSelect` row.

Ported to `svelte-convex-starter` and `svelte-convex-starter-i18n` (not ecommerce-specific):
`formControl.ts` + form internals, `pageValidator.ts` (under `convex/validators/`),
`getUploadByKey.ts`, `runAuthAction.ts` (+ the two dialogs and `useAuth`'s result type),
the shared `confirm-dialog-actions` component (now used by the danger-zone/ban dialogs in
all three projects, which also removed the plain starter's 17-line action-row clone), and
the logs `{@const}` (i18n starter). All three verified: oxlint/eslint/prettier clean,
svelte-check 0/0, build exit 0.

### Leave alone

- `src/convex/betterAuth/component/queries/*` ↔ `src/convex/betterAuth/tables/users/queries/*`
  (16 + 14 + 9): `component/**` is an isolated Convex component boundary and cannot
  import app code, so the duplication is structural.
- `tools/oxlint/anti-slop/**` (~6 groups incl. 100-line `checkReturnType`): vendored
  lint-plugin source, not app code.

## Complexity hotspots (`fallow health`)

### Done — Convex handlers (verified by the 57 Convex tests + build)

Refactored into cohesive helpers (behaviour-identical, all tests green):

| Handler                       | before         | after                                                                                                                           |
| ----------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `saveProduct`                 | cyc=37, cog=28 | cyc=22, cog=13 (helpers: `assertStockRules`, `resolveProductSlug`, `resolveImageKeys`)                                          |
| `completeCheckoutReservation` | cyc=28, cog=31 | off the critical list (helpers: `resolveReplayedOrder`, `buildInventoryUpdates`, shared `allocateOrderCode`/`insertOrderItems`) |
| `createCheckoutReservation`   | cyc=21, cog=25 | off the list (shared `mergeItemQuantities`, `loadSellableProduct`, `buildCheckoutLine`)                                         |
| `applyStripeRefund`           | cyc=21, cog=16 | off the list (`assertValidRefund`, `applyRefundStatus`)                                                                         |
| `createStripeCheckout`        | cyc=20, cog=14 | off the list (`buildCheckoutMetadata`)                                                                                          |
| `createOrder`                 | cyc=19, cog=16 | off the list (`assertValidSnapshot`, `resolveExistingOrder`, shared helpers)                                                    |
| `fetchCheckoutOrder`          | cyc=17, cog=19 | off the list (`buildCheckoutItems` + shared helpers)                                                                            |

New shared helpers also removed real duplication between the checkout paths:
`orders/helpers/allocateOrderCode.ts`, `insertOrderItems.ts`, `mergeItemQuantities.ts`,
`buildCheckoutLine.ts`, and `products/helpers/loadSellableProduct.ts`.

- [x] `areEqual` (`useFormChanges`) split into `areDatesEqual` / `areArraysEqual` / `areObjectsEqual`
      (ported to both starters).
- [x] Replaced the `const { items: _items, ...customer } = data` rest-omit in `createOrder`
      with a shared `shared/features/orders/utils/buildOrderCustomer.ts` (now also used by
      `completeCheckoutReservation`, which had the same explicit pick). No DB access, so it
      lives with the shared order utils rather than the Convex table helpers. `eslint` no
      longer needs `ignoreRestSiblings`: the only `_items` error is gone.

### Left as-is (deliberate)

- `getBackendErrorMessage` (cyc=34, **cog=3**) — a flat 30-case lookup switch; converting it to a
  table would be metric-chasing, not a readability win.
- `getOrderQuery` (cog=12) — 7 sequential "pick the best index" branches; the branches are the rule.
- `buildAdminUserWhere` (cog=13) — three explicit symbolic → where mappings; already flat.
- `data-table` (cog=47) / `data-list` (cog=30) templates — branchy by nature (generic harness), no
  automated coverage, and generic enough that any change needs porting to the starters.
- `useForm.submit` (cog=26) — same reasoning (no UI tests).
- `saveProduct` is still cyc=22 (just over the 20 threshold); the remainder is orchestration
  (parse → load → validate → build fields → insert/patch → audit → return).

## Verification

- [x] `npx fallow dead-code` / `npx fallow dupes` re-run; findings tracked throughout.
- [x] `bun run check`, `bunx --bun oxlint`, and the full test suite after each change set.

## Carried over from previous TODO

- [ ] Verify the receipt waiting state and automatic update in a browser with Stripe sandbox.
- [ ] Verify guest order storage and first-return cart clearing in a browser after a sandbox payment.
- [ ] Complete a new end-to-end Stripe sandbox purchase using the updated flow.
- [ ] Add inventory handling at the chosen reservation or payment boundary.
- [ ] Build the dashboard metrics and aggregates from verified order payment state.
