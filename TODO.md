# E-commerce Deletion TODO

## Step 1 — Delete categories

- [x] Add an admin-only `deleteCategory` mutation.
- [x] Check whether any products reference the category through `products.categoryId`.
- [x] If products are linked, reject deletion with a translated error listing their names; use a bounded name list plus the total count for large categories.
- [x] Require the admin to remove the category from those products before trying again.
- [x] Keep every product untouched.
- [x] Delete the category image from storage.
- [x] Delete the category record and write an audit log.
- [x] Leave all product category references unchanged when deletion is rejected.
- [x] Add tests for linked products, product-name error details, image cleanup, authorization, and audit logging.

## Step 2 — Make product hard deletion production-safe

- [ ] Store immutable order-item snapshots: product name, SKU/variant, unit price, quantity, and other historical display data.
- [ ] Never depend on the live product record to render historical orders.
- [ ] Clean all product-owned data during deletion:
  - [ ] The category reference.
  - [ ] Variants and bundle links.
  - [ ] Inventory records.
  - [ ] Product images.
  - [ ] Stale cart and wishlist references.
- [ ] Keep deletion admin-only, explicitly confirmed, audited, and transactional where possible.
- [ ] Use batched cleanup for products with many dependent records or files.
- [ ] Keep archiving available as a business option, but do not require it for products that can be safely hard-deleted.

Historical orders must remain intact after product deletion because they contain their own immutable snapshots.
