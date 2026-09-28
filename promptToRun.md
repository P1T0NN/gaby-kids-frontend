Task: deploy the already-ported product option filter feature to PRODUCTION and run its data backfill. Production has ~80 products. Do NOT write or modify application code — everything needed is already in the repo; this is deploy + migrations + verification only.

Context to read first (do not edit them):
- docs/ProductOptionFiltersDesign.md (especially "Migration" and the write path)
- AGENTS.md

Preflight (stop and report if anything fails):
1. `git status` — note the dirty files; they are prior port work, keep them.
2. `bun run check` and `bun run test:convex` — both must be green before deploying.

Deploy to production:
3. Run `npx convex deploy`.
   - This pushes the schema (`productOptionIndex` table with its `name` field, search index, and the updated products search index) and all functions to the production deployment, and regenerates `src/convex/_generated/`.
   - If it asks for confirmation (e.g. building new indexes), accept; index builds on ~80 products are fast.
   - If the deploy fails on schema validation, STOP and paste the exact error — do not force anything or hand-edit generated files.

Backfill (order matters), against PRODUCTION — note the `--prod` flag on every run:
4. Step 1 — rebuild every product's option index rows:
   `npx convex run --prod migrations/migrations:run "{\`"fn\`":\`"tables/productOptionIndex/migrations/backfillProductOptionIndex:backfillProductOptionIndex\`"}"`
5. Step 2 — fill in the search `name` on existing rows:
   `npx convex run --prod migrations/migrations:run "{\`"fn\`":\`"tables/productOptionIndex/migrations/backfillProductOptionIndex:backfillProductOptionNames\`"}"`
   - The escaped `\`"` form above is required on Windows PowerShell 5.1. On bash/zsh use normal JSON: `npx convex run --prod migrations/migrations:run '{"fn":"tables/productOptionIndex/migrations/backfillProductOptionIndex:backfillProductOptionIndex"}'`
   - Both migrations are idempotent. Each is done when the output says `"Status": "Migration was started and finished in one batch."`. If it reports started but not finished, re-run the same command until finished.
   - With ~80 products expect a single batch each.

Verify (all against `--prod`):
6. `npx convex data --prod productOptionIndex` — confirm rows exist and the `name` column is populated. IMPORTANT: if zero rows come back, that is not a failure by itself — it means no product currently has variant options whose names match the configured `Color` / `Talla` (see `src/shared/features/productVariants/data/productOptionFilters.ts`). Report it as a config-vs-data mismatch for the owner to check, including a sample of actual option names from `npx convex data --prod productVariants`.
7. End-to-end check with real data: take one `optionKey` from step 6 (e.g. `color:rojo|talla:5`), translate it to filter args (`color=rojo`, `age=5`), and run:
   `npx convex run --prod tables/products/queries/fetchAllProductsPublic:fetchAllProductsPublic "{\`"paginationOpts\`":{\`"cursor\`":null,\`"numItems\`":12},\`"filters\`":{\`"color\`":\`"rojo\`"}}"`
   (swap the values for the real key). Expect the matching product(s) in `items`; then add the second filter to confirm the combined search+filter path works.
8. Also run an unfiltered public listing and confirm `total` equals 80 and 12 items come back, proving production is intact.

Report back:
- Deploy result (success/error, any index builds).
- Each migration's status, processed count, and the exact commands used.
- `productOptionIndex` row count and whether `name` is populated.
- Result of the end-to-end filtered query.
- Any mismatch between configured option names/values and the actual admin data, and anything else that needs the owner's attention.

Guardrails: no code edits, no hand-editing `src/convex/_generated/*`, no destructive commands, no retries with force flags — if something fails, stop and report the exact output.
After they run it, production should be filterable. If step 6 returns zero rows, the only thing to do is align productOptionFilters.ts (optionName/values) with the exact strings admins typed and re-run step 4 (or just re-save products).