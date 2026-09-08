# Upsells System Design

Status: admin management and backend implemented. Storefront placement remains
a separate step.

## Decision

There is one kind of upsell: one product recommends other ordinary products.
A global storefront setting decides where those recommendations
appear for every product.

| Global storefront mode | Upsell placement                                    |
| ---------------------- | --------------------------------------------------- |
| Product pages enabled  | Upsell section on the source product's page         |
| Product pages disabled | Small dialog after the product is added to the cart |

Product-page availability is not stored per product, and its global
configuration is outside this system. Do not store an upsell `type` or
`placement`; placement is derived from that global setting.

## Product fields

Keep the configuration on the existing `products` document:

```ts
products: defineTable({
	// existing product fields
	upsellProductIds: v.optional(v.array(v.id('products')))
});
```

| Field              | Contract                                                                   |
| ------------------ | -------------------------------------------------------------------------- |
| `upsellProductIds` | Ordered IDs of the products to recommend. An empty array means no upsells. |

Upsells are a small, bounded part of the product configuration, so a separate
table is unnecessary. Allow at most four. The save mutation validates that the
IDs are distinct, refer to active products, and do not include the source
product.

The field is optional for existing products; a missing array means no upsells.

The array order is the storefront display order. `saveProductUpsells` replaces
only this array, using the existing admin mutation builder and audit log.
Ordinary product edits preserve upsells. No emails are sent for this admin action.

## Admin experience

Manage upsells at `/admin/upsells`:

1. The searchable list shows only products with configured upsells.
2. When none exist, the page shows the standard empty state.
3. **Add Upsell** is the entry point for the replacement editor UI.

The merchant never chooses an upsell type. They only choose the products and
their order.

## Storefront behavior

Use one public `fetchProductUpsells(productId)` query for both placements. It
loads the source product, resolves `upsellProductIds` in their stored order, and
returns only active products using the normal storefront product shape.

- When product pages are globally enabled, render the returned products in an
  upsell section on the source product's page.
- When product pages are globally disabled, add the original product to the
  cart first, then open the dialog when the query returns at least one upsell.
- Adding an upsell uses the existing cart action. Its current product price and
  normal checkout rules remain authoritative.

No special upsell product, price, cart line, order line, discount, or analytics
table is needed.

Feature configuration and input validation live in `src/shared/features/upsells`.
The save mutation and admin/public queries live in `src/convex/tables/upsells`.
