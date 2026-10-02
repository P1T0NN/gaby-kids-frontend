# Storage production TODO

Use these steps for any project's temporary R2 upload bucket. Replace
`<project>-temporary` with its actual bucket name, for example
`gaby-kids-temporary`.

1. Open **R2 Object Storage → `<project>-temporary` → Settings**.
2. Find **Object Lifecycle Rules** and click **Add rule**.
3. Configure:
   - **Rule name:** `expire-originals`
   - **Prefix:** `originals/` — include the trailing slash.
   - **Action:** Delete objects.
   - **Age:** **1 day** after upload.
   - **Status:** Enabled, if shown.
4. Click **Save changes** and confirm the rule appears enabled.

Apply this rule to the temporary upload bucket only. Normal application cleanup
deletes originals immediately; this rule catches leftovers during outages.
Lifecycle deletion runs asynchronously, so it may happen later than 24 hours.

[Cloudflare lifecycle instructions](https://developers.cloudflare.com/r2/buckets/object-lifecycles/#dashboard)
