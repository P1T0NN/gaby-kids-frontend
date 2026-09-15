/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as aggregates_helpers_createCounterAggregate from "../aggregates/helpers/createCounterAggregate.js";
import type * as aggregates_helpers_getFilteredTotalAggregate from "../aggregates/helpers/getFilteredTotalAggregate.js";
import type * as aggregates_helpers_getTotalSizeAggregate from "../aggregates/helpers/getTotalSizeAggregate.js";
import type * as aggregates_triggersAggregate from "../aggregates/triggersAggregate.js";
import type * as aggregates_types_aggregateTypes from "../aggregates/types/aggregateTypes.js";
import type * as aggregates_utils_getPrefixRangeBoundsAggregate from "../aggregates/utils/getPrefixRangeBoundsAggregate.js";
import type * as auditLogs_crons_cleanupAuditLogsCron from "../auditLogs/crons/cleanupAuditLogsCron.js";
import type * as auditLogs_helpers_logAuditBulk from "../auditLogs/helpers/logAuditBulk.js";
import type * as auditLogs_helpers_logAuditChange from "../auditLogs/helpers/logAuditChange.js";
import type * as auditLogs_helpers_logAuditEvent from "../auditLogs/helpers/logAuditEvent.js";
import type * as auditLogs_mutations_writeAuditBulk from "../auditLogs/mutations/writeAuditBulk.js";
import type * as auditLogs_mutations_writeAuditChange from "../auditLogs/mutations/writeAuditChange.js";
import type * as auditLogs_mutations_writeAuditEvent from "../auditLogs/mutations/writeAuditEvent.js";
import type * as auditLogs_queries_fetchAuditLogsAdmin from "../auditLogs/queries/fetchAuditLogsAdmin.js";
import type * as auditLogs_types_auditLogsTypes from "../auditLogs/types/auditLogsTypes.js";
import type * as auth from "../auth.js";
import type * as betterAuth_auth from "../betterAuth/auth.js";
import type * as betterAuth_cleanupDeletedUserData from "../betterAuth/cleanupDeletedUserData.js";
import type * as betterAuth_config from "../betterAuth/config.js";
import type * as betterAuth_emails_sendVerificationOTPEmail from "../betterAuth/emails/sendVerificationOTPEmail.js";
import type * as betterAuth_helpers_requireIdentity from "../betterAuth/helpers/requireIdentity.js";
import type * as betterAuth_helpers_sendOtpEmail from "../betterAuth/helpers/sendOtpEmail.js";
import type * as betterAuth_tables_users_aggregates_userTotalAggregate from "../betterAuth/tables/users/aggregates/userTotalAggregate.js";
import type * as betterAuth_tables_users_helpers_filterPredicates from "../betterAuth/tables/users/helpers/filterPredicates.js";
import type * as betterAuth_tables_users_migrations_backfillUserTotal from "../betterAuth/tables/users/migrations/backfillUserTotal.js";
import type * as betterAuth_tables_users_queries_fetchUserBreadcrumbAdmin from "../betterAuth/tables/users/queries/fetchUserBreadcrumbAdmin.js";
import type * as betterAuth_tables_users_queries_fetchUserLogsAdmin from "../betterAuth/tables/users/queries/fetchUserLogsAdmin.js";
import type * as betterAuth_tables_users_queries_fetchUserProfileAdmin from "../betterAuth/tables/users/queries/fetchUserProfileAdmin.js";
import type * as betterAuth_tables_users_queries_fetchUserSessionsAdmin from "../betterAuth/tables/users/queries/fetchUserSessionsAdmin.js";
import type * as betterAuth_tables_users_queries_fetchUserSettingsAdmin from "../betterAuth/tables/users/queries/fetchUserSettingsAdmin.js";
import type * as betterAuth_tables_users_queries_fetchUsersAdmin from "../betterAuth/tables/users/queries/fetchUsersAdmin.js";
import type * as builders_convexFunctionBuilders from "../builders/convexFunctionBuilders.js";
import type * as crons from "../crons.js";
import type * as emails_data_emailData from "../emails/data/emailData.js";
import type * as emails_sendEmail from "../emails/sendEmail.js";
import type * as emails_templates_footerTemplate from "../emails/templates/footerTemplate.js";
import type * as emails_templates_headerTemplate from "../emails/templates/headerTemplate.js";
import type * as emails_templates_orderCancelledCustomerTemplate from "../emails/templates/orderCancelledCustomerTemplate.js";
import type * as emails_templates_orderCreatedAdminTemplate from "../emails/templates/orderCreatedAdminTemplate.js";
import type * as emails_templates_orderCreatedCustomerTemplate from "../emails/templates/orderCreatedCustomerTemplate.js";
import type * as emails_templates_orderFulfilledCustomerTemplate from "../emails/templates/orderFulfilledCustomerTemplate.js";
import type * as emails_types_emailTypes from "../emails/types/emailTypes.js";
import type * as helpers_getPagination from "../helpers/getPagination.js";
import type * as helpers_paginateSearch from "../helpers/paginateSearch.js";
import type * as http from "../http.js";
import type * as migrations_backfillOrderCodes from "../migrations/backfillOrderCodes.js";
import type * as migrations_backfillOwnerIds from "../migrations/backfillOwnerIds.js";
import type * as migrations_backfillProductSlugs from "../migrations/backfillProductSlugs.js";
import type * as migrations_backfillRequiredProductFields from "../migrations/backfillRequiredProductFields.js";
import type * as migrations_migrations from "../migrations/migrations.js";
import type * as migrations_types_migrationTypes from "../migrations/types/migrationTypes.js";
import type * as rateLimits_helpers_enforceRateLimit from "../rateLimits/helpers/enforceRateLimit.js";
import type * as rateLimits_types_rateLimitTypes from "../rateLimits/types/rateLimitTypes.js";
import type * as storage_r2 from "../storage/r2.js";
import type * as stripe_actions_createStripeCheckout from "../stripe/actions/createStripeCheckout.js";
import type * as stripe_actions_refundOrder from "../stripe/actions/refundOrder.js";
import type * as stripe_actions_verifyStripeWebhook from "../stripe/actions/verifyStripeWebhook.js";
import type * as stripe_helpers_applyStripeCheckoutEvent from "../stripe/helpers/applyStripeCheckoutEvent.js";
import type * as stripe_helpers_readPaidCheckout from "../stripe/helpers/readPaidCheckout.js";
import type * as stripe_helpers_readStripeRefund from "../stripe/helpers/readStripeRefund.js";
import type * as stripe_http_stripeWebhook from "../stripe/http/stripeWebhook.js";
import type * as stripe_utils_buildCheckoutLineItems from "../stripe/utils/buildCheckoutLineItems.js";
import type * as stripe_utils_hasInvalidStripeOrderPayment from "../stripe/utils/hasInvalidStripeOrderPayment.js";
import type * as stripe_utils_hasInvalidStripeSessions from "../stripe/utils/hasInvalidStripeSessions.js";
import type * as stripe_validators_stripeValidators from "../stripe/validators/stripeValidators.js";
import type * as tables_categories_aggregates_categoryAggregate from "../tables/categories/aggregates/categoryAggregate.js";
import type * as tables_categories_aggregates_productsByCategoryAggregate from "../tables/categories/aggregates/productsByCategoryAggregate.js";
import type * as tables_categories_helpers_getCategoryImageKey from "../tables/categories/helpers/getCategoryImageKey.js";
import type * as tables_categories_helpers_getCategoryPage from "../tables/categories/helpers/getCategoryPage.js";
import type * as tables_categories_helpers_invalidCategory from "../tables/categories/helpers/invalidCategory.js";
import type * as tables_categories_helpers_validateProductCategory from "../tables/categories/helpers/validateProductCategory.js";
import type * as tables_categories_migrations_backfillCategoryAggregate from "../tables/categories/migrations/backfillCategoryAggregate.js";
import type * as tables_categories_migrations_backfillProductsByCategoryAggregate from "../tables/categories/migrations/backfillProductsByCategoryAggregate.js";
import type * as tables_categories_mutations_createCategory from "../tables/categories/mutations/createCategory.js";
import type * as tables_categories_mutations_deleteCategory from "../tables/categories/mutations/deleteCategory.js";
import type * as tables_categories_mutations_updateCategory from "../tables/categories/mutations/updateCategory.js";
import type * as tables_categories_queries_fetchCategoriesAdmin from "../tables/categories/queries/fetchCategoriesAdmin.js";
import type * as tables_categories_queries_fetchCategoriesSearch from "../tables/categories/queries/fetchCategoriesSearch.js";
import type * as tables_categories_queries_fetchCategory from "../tables/categories/queries/fetchCategory.js";
import type * as tables_categories_queries_fetchCategoryOptions from "../tables/categories/queries/fetchCategoryOptions.js";
import type * as tables_categories_validators_categoryValidators from "../tables/categories/validators/categoryValidators.js";
import type * as tables_orders_aggregates_orderAggregate from "../tables/orders/aggregates/orderAggregate.js";
import type * as tables_orders_emails_sendOrderCreatedEmails from "../tables/orders/emails/sendOrderCreatedEmails.js";
import type * as tables_orders_emails_sendOrderStatusEmail from "../tables/orders/emails/sendOrderStatusEmail.js";
import type * as tables_orders_helpers_createOrderCode from "../tables/orders/helpers/createOrderCode.js";
import type * as tables_orders_helpers_getOrderQuery from "../tables/orders/helpers/getOrderQuery.js";
import type * as tables_orders_helpers_toCustomerOrder from "../tables/orders/helpers/toCustomerOrder.js";
import type * as tables_orders_mutations_applyStripeRefund from "../tables/orders/mutations/applyStripeRefund.js";
import type * as tables_orders_mutations_createOrder from "../tables/orders/mutations/createOrder.js";
import type * as tables_orders_mutations_updateOrderAdmin from "../tables/orders/mutations/updateOrderAdmin.js";
import type * as tables_orders_queries_fetchAllOrdersAdmin from "../tables/orders/queries/fetchAllOrdersAdmin.js";
import type * as tables_orders_queries_fetchCheckoutOrder from "../tables/orders/queries/fetchCheckoutOrder.js";
import type * as tables_orders_queries_fetchMyOrder from "../tables/orders/queries/fetchMyOrder.js";
import type * as tables_orders_queries_fetchMyOrders from "../tables/orders/queries/fetchMyOrders.js";
import type * as tables_orders_queries_fetchOrderAdmin from "../tables/orders/queries/fetchOrderAdmin.js";
import type * as tables_orders_queries_fetchOrderForRefund from "../tables/orders/queries/fetchOrderForRefund.js";
import type * as tables_orders_queries_fetchOrderReceipt from "../tables/orders/queries/fetchOrderReceipt.js";
import type * as tables_orders_utils_applyOrderFilters from "../tables/orders/utils/applyOrderFilters.js";
import type * as tables_orders_validators_orderValidators from "../tables/orders/validators/orderValidators.js";
import type * as tables_products_aggregates_productAggregate from "../tables/products/aggregates/productAggregate.js";
import type * as tables_products_aggregates_productsByStatusAggregate from "../tables/products/aggregates/productsByStatusAggregate.js";
import type * as tables_products_helpers_getProductPage from "../tables/products/helpers/getProductPage.js";
import type * as tables_products_helpers_getProductsById from "../tables/products/helpers/getProductsById.js";
import type * as tables_products_mappers_toProductResult from "../tables/products/mappers/toProductResult.js";
import type * as tables_products_mutations_deleteProduct from "../tables/products/mutations/deleteProduct.js";
import type * as tables_products_mutations_saveProduct from "../tables/products/mutations/saveProduct.js";
import type * as tables_products_queries_fetchAllProductsAdmin from "../tables/products/queries/fetchAllProductsAdmin.js";
import type * as tables_products_queries_fetchAllProductsPublic from "../tables/products/queries/fetchAllProductsPublic.js";
import type * as tables_products_queries_fetchCart from "../tables/products/queries/fetchCart.js";
import type * as tables_products_queries_fetchProductById from "../tables/products/queries/fetchProductById.js";
import type * as tables_products_queries_fetchProductBySlug from "../tables/products/queries/fetchProductBySlug.js";
import type * as tables_products_queries_fetchProductsSearch from "../tables/products/queries/fetchProductsSearch.js";
import type * as tables_products_utils_applyProductFilters from "../tables/products/utils/applyProductFilters.js";
import type * as tables_products_utils_filterPredicates from "../tables/products/utils/filterPredicates.js";
import type * as tables_products_validators_productValidators from "../tables/products/validators/productValidators.js";
import type * as tables_upsells_helpers_getStorefrontUpsells from "../tables/upsells/helpers/getStorefrontUpsells.js";
import type * as tables_upsells_mutations_saveProductUpsells from "../tables/upsells/mutations/saveProductUpsells.js";
import type * as tables_upsells_mutations_trackUpsellEvent from "../tables/upsells/mutations/trackUpsellEvent.js";
import type * as tables_upsells_queries_fetchProductUpsells from "../tables/upsells/queries/fetchProductUpsells.js";
import type * as tables_upsells_queries_fetchUpsellForEdit from "../tables/upsells/queries/fetchUpsellForEdit.js";
import type * as tables_upsells_queries_fetchUpsellsAdmin from "../tables/upsells/queries/fetchUpsellsAdmin.js";
import type * as tables_upsells_validators_upsellValidators from "../tables/upsells/validators/upsellValidators.js";
import type * as turnstile_verifyTurnstile from "../turnstile/verifyTurnstile.js";
import type * as utils_buildFilterWhere from "../utils/buildFilterWhere.js";
import type * as utils_cursorPagination from "../utils/cursorPagination.js";
import type * as wrappers_fetchOptimizedQuery from "../wrappers/fetchOptimizedQuery.js";
import type * as wrappers_fetchOptimizedSearchQuery from "../wrappers/fetchOptimizedSearchQuery.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "aggregates/helpers/createCounterAggregate": typeof aggregates_helpers_createCounterAggregate;
  "aggregates/helpers/getFilteredTotalAggregate": typeof aggregates_helpers_getFilteredTotalAggregate;
  "aggregates/helpers/getTotalSizeAggregate": typeof aggregates_helpers_getTotalSizeAggregate;
  "aggregates/triggersAggregate": typeof aggregates_triggersAggregate;
  "aggregates/types/aggregateTypes": typeof aggregates_types_aggregateTypes;
  "aggregates/utils/getPrefixRangeBoundsAggregate": typeof aggregates_utils_getPrefixRangeBoundsAggregate;
  "auditLogs/crons/cleanupAuditLogsCron": typeof auditLogs_crons_cleanupAuditLogsCron;
  "auditLogs/helpers/logAuditBulk": typeof auditLogs_helpers_logAuditBulk;
  "auditLogs/helpers/logAuditChange": typeof auditLogs_helpers_logAuditChange;
  "auditLogs/helpers/logAuditEvent": typeof auditLogs_helpers_logAuditEvent;
  "auditLogs/mutations/writeAuditBulk": typeof auditLogs_mutations_writeAuditBulk;
  "auditLogs/mutations/writeAuditChange": typeof auditLogs_mutations_writeAuditChange;
  "auditLogs/mutations/writeAuditEvent": typeof auditLogs_mutations_writeAuditEvent;
  "auditLogs/queries/fetchAuditLogsAdmin": typeof auditLogs_queries_fetchAuditLogsAdmin;
  "auditLogs/types/auditLogsTypes": typeof auditLogs_types_auditLogsTypes;
  auth: typeof auth;
  "betterAuth/auth": typeof betterAuth_auth;
  "betterAuth/cleanupDeletedUserData": typeof betterAuth_cleanupDeletedUserData;
  "betterAuth/config": typeof betterAuth_config;
  "betterAuth/emails/sendVerificationOTPEmail": typeof betterAuth_emails_sendVerificationOTPEmail;
  "betterAuth/helpers/requireIdentity": typeof betterAuth_helpers_requireIdentity;
  "betterAuth/helpers/sendOtpEmail": typeof betterAuth_helpers_sendOtpEmail;
  "betterAuth/tables/users/aggregates/userTotalAggregate": typeof betterAuth_tables_users_aggregates_userTotalAggregate;
  "betterAuth/tables/users/helpers/filterPredicates": typeof betterAuth_tables_users_helpers_filterPredicates;
  "betterAuth/tables/users/migrations/backfillUserTotal": typeof betterAuth_tables_users_migrations_backfillUserTotal;
  "betterAuth/tables/users/queries/fetchUserBreadcrumbAdmin": typeof betterAuth_tables_users_queries_fetchUserBreadcrumbAdmin;
  "betterAuth/tables/users/queries/fetchUserLogsAdmin": typeof betterAuth_tables_users_queries_fetchUserLogsAdmin;
  "betterAuth/tables/users/queries/fetchUserProfileAdmin": typeof betterAuth_tables_users_queries_fetchUserProfileAdmin;
  "betterAuth/tables/users/queries/fetchUserSessionsAdmin": typeof betterAuth_tables_users_queries_fetchUserSessionsAdmin;
  "betterAuth/tables/users/queries/fetchUserSettingsAdmin": typeof betterAuth_tables_users_queries_fetchUserSettingsAdmin;
  "betterAuth/tables/users/queries/fetchUsersAdmin": typeof betterAuth_tables_users_queries_fetchUsersAdmin;
  "builders/convexFunctionBuilders": typeof builders_convexFunctionBuilders;
  crons: typeof crons;
  "emails/data/emailData": typeof emails_data_emailData;
  "emails/sendEmail": typeof emails_sendEmail;
  "emails/templates/footerTemplate": typeof emails_templates_footerTemplate;
  "emails/templates/headerTemplate": typeof emails_templates_headerTemplate;
  "emails/templates/orderCancelledCustomerTemplate": typeof emails_templates_orderCancelledCustomerTemplate;
  "emails/templates/orderCreatedAdminTemplate": typeof emails_templates_orderCreatedAdminTemplate;
  "emails/templates/orderCreatedCustomerTemplate": typeof emails_templates_orderCreatedCustomerTemplate;
  "emails/templates/orderFulfilledCustomerTemplate": typeof emails_templates_orderFulfilledCustomerTemplate;
  "emails/types/emailTypes": typeof emails_types_emailTypes;
  "helpers/getPagination": typeof helpers_getPagination;
  "helpers/paginateSearch": typeof helpers_paginateSearch;
  http: typeof http;
  "migrations/backfillOrderCodes": typeof migrations_backfillOrderCodes;
  "migrations/backfillOwnerIds": typeof migrations_backfillOwnerIds;
  "migrations/backfillProductSlugs": typeof migrations_backfillProductSlugs;
  "migrations/backfillRequiredProductFields": typeof migrations_backfillRequiredProductFields;
  "migrations/migrations": typeof migrations_migrations;
  "migrations/types/migrationTypes": typeof migrations_types_migrationTypes;
  "rateLimits/helpers/enforceRateLimit": typeof rateLimits_helpers_enforceRateLimit;
  "rateLimits/types/rateLimitTypes": typeof rateLimits_types_rateLimitTypes;
  "storage/r2": typeof storage_r2;
  "stripe/actions/createStripeCheckout": typeof stripe_actions_createStripeCheckout;
  "stripe/actions/refundOrder": typeof stripe_actions_refundOrder;
  "stripe/actions/verifyStripeWebhook": typeof stripe_actions_verifyStripeWebhook;
  "stripe/helpers/applyStripeCheckoutEvent": typeof stripe_helpers_applyStripeCheckoutEvent;
  "stripe/helpers/readPaidCheckout": typeof stripe_helpers_readPaidCheckout;
  "stripe/helpers/readStripeRefund": typeof stripe_helpers_readStripeRefund;
  "stripe/http/stripeWebhook": typeof stripe_http_stripeWebhook;
  "stripe/utils/buildCheckoutLineItems": typeof stripe_utils_buildCheckoutLineItems;
  "stripe/utils/hasInvalidStripeOrderPayment": typeof stripe_utils_hasInvalidStripeOrderPayment;
  "stripe/utils/hasInvalidStripeSessions": typeof stripe_utils_hasInvalidStripeSessions;
  "stripe/validators/stripeValidators": typeof stripe_validators_stripeValidators;
  "tables/categories/aggregates/categoryAggregate": typeof tables_categories_aggregates_categoryAggregate;
  "tables/categories/aggregates/productsByCategoryAggregate": typeof tables_categories_aggregates_productsByCategoryAggregate;
  "tables/categories/helpers/getCategoryImageKey": typeof tables_categories_helpers_getCategoryImageKey;
  "tables/categories/helpers/getCategoryPage": typeof tables_categories_helpers_getCategoryPage;
  "tables/categories/helpers/invalidCategory": typeof tables_categories_helpers_invalidCategory;
  "tables/categories/helpers/validateProductCategory": typeof tables_categories_helpers_validateProductCategory;
  "tables/categories/migrations/backfillCategoryAggregate": typeof tables_categories_migrations_backfillCategoryAggregate;
  "tables/categories/migrations/backfillProductsByCategoryAggregate": typeof tables_categories_migrations_backfillProductsByCategoryAggregate;
  "tables/categories/mutations/createCategory": typeof tables_categories_mutations_createCategory;
  "tables/categories/mutations/deleteCategory": typeof tables_categories_mutations_deleteCategory;
  "tables/categories/mutations/updateCategory": typeof tables_categories_mutations_updateCategory;
  "tables/categories/queries/fetchCategoriesAdmin": typeof tables_categories_queries_fetchCategoriesAdmin;
  "tables/categories/queries/fetchCategoriesSearch": typeof tables_categories_queries_fetchCategoriesSearch;
  "tables/categories/queries/fetchCategory": typeof tables_categories_queries_fetchCategory;
  "tables/categories/queries/fetchCategoryOptions": typeof tables_categories_queries_fetchCategoryOptions;
  "tables/categories/validators/categoryValidators": typeof tables_categories_validators_categoryValidators;
  "tables/orders/aggregates/orderAggregate": typeof tables_orders_aggregates_orderAggregate;
  "tables/orders/emails/sendOrderCreatedEmails": typeof tables_orders_emails_sendOrderCreatedEmails;
  "tables/orders/emails/sendOrderStatusEmail": typeof tables_orders_emails_sendOrderStatusEmail;
  "tables/orders/helpers/createOrderCode": typeof tables_orders_helpers_createOrderCode;
  "tables/orders/helpers/getOrderQuery": typeof tables_orders_helpers_getOrderQuery;
  "tables/orders/helpers/toCustomerOrder": typeof tables_orders_helpers_toCustomerOrder;
  "tables/orders/mutations/applyStripeRefund": typeof tables_orders_mutations_applyStripeRefund;
  "tables/orders/mutations/createOrder": typeof tables_orders_mutations_createOrder;
  "tables/orders/mutations/updateOrderAdmin": typeof tables_orders_mutations_updateOrderAdmin;
  "tables/orders/queries/fetchAllOrdersAdmin": typeof tables_orders_queries_fetchAllOrdersAdmin;
  "tables/orders/queries/fetchCheckoutOrder": typeof tables_orders_queries_fetchCheckoutOrder;
  "tables/orders/queries/fetchMyOrder": typeof tables_orders_queries_fetchMyOrder;
  "tables/orders/queries/fetchMyOrders": typeof tables_orders_queries_fetchMyOrders;
  "tables/orders/queries/fetchOrderAdmin": typeof tables_orders_queries_fetchOrderAdmin;
  "tables/orders/queries/fetchOrderForRefund": typeof tables_orders_queries_fetchOrderForRefund;
  "tables/orders/queries/fetchOrderReceipt": typeof tables_orders_queries_fetchOrderReceipt;
  "tables/orders/utils/applyOrderFilters": typeof tables_orders_utils_applyOrderFilters;
  "tables/orders/validators/orderValidators": typeof tables_orders_validators_orderValidators;
  "tables/products/aggregates/productAggregate": typeof tables_products_aggregates_productAggregate;
  "tables/products/aggregates/productsByStatusAggregate": typeof tables_products_aggregates_productsByStatusAggregate;
  "tables/products/helpers/getProductPage": typeof tables_products_helpers_getProductPage;
  "tables/products/helpers/getProductsById": typeof tables_products_helpers_getProductsById;
  "tables/products/mappers/toProductResult": typeof tables_products_mappers_toProductResult;
  "tables/products/mutations/deleteProduct": typeof tables_products_mutations_deleteProduct;
  "tables/products/mutations/saveProduct": typeof tables_products_mutations_saveProduct;
  "tables/products/queries/fetchAllProductsAdmin": typeof tables_products_queries_fetchAllProductsAdmin;
  "tables/products/queries/fetchAllProductsPublic": typeof tables_products_queries_fetchAllProductsPublic;
  "tables/products/queries/fetchCart": typeof tables_products_queries_fetchCart;
  "tables/products/queries/fetchProductById": typeof tables_products_queries_fetchProductById;
  "tables/products/queries/fetchProductBySlug": typeof tables_products_queries_fetchProductBySlug;
  "tables/products/queries/fetchProductsSearch": typeof tables_products_queries_fetchProductsSearch;
  "tables/products/utils/applyProductFilters": typeof tables_products_utils_applyProductFilters;
  "tables/products/utils/filterPredicates": typeof tables_products_utils_filterPredicates;
  "tables/products/validators/productValidators": typeof tables_products_validators_productValidators;
  "tables/upsells/helpers/getStorefrontUpsells": typeof tables_upsells_helpers_getStorefrontUpsells;
  "tables/upsells/mutations/saveProductUpsells": typeof tables_upsells_mutations_saveProductUpsells;
  "tables/upsells/mutations/trackUpsellEvent": typeof tables_upsells_mutations_trackUpsellEvent;
  "tables/upsells/queries/fetchProductUpsells": typeof tables_upsells_queries_fetchProductUpsells;
  "tables/upsells/queries/fetchUpsellForEdit": typeof tables_upsells_queries_fetchUpsellForEdit;
  "tables/upsells/queries/fetchUpsellsAdmin": typeof tables_upsells_queries_fetchUpsellsAdmin;
  "tables/upsells/validators/upsellValidators": typeof tables_upsells_validators_upsellValidators;
  "turnstile/verifyTurnstile": typeof turnstile_verifyTurnstile;
  "utils/buildFilterWhere": typeof utils_buildFilterWhere;
  "utils/cursorPagination": typeof utils_cursorPagination;
  "wrappers/fetchOptimizedQuery": typeof wrappers_fetchOptimizedQuery;
  "wrappers/fetchOptimizedSearchQuery": typeof wrappers_fetchOptimizedSearchQuery;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("../betterAuth/component/_generated/component.js").ComponentApi<"betterAuth">;
  migrations: import("@convex-dev/migrations/_generated/component.js").ComponentApi<"migrations">;
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
  resend: import("@convex-dev/resend/_generated/component.js").ComponentApi<"resend">;
  analytics: import("@vllnt/convex-analytics/_generated/component.js").ComponentApi<"analytics">;
  productsAggregate: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"productsAggregate">;
  categoriesAggregate: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"categoriesAggregate">;
  ordersAggregate: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"ordersAggregate">;
  r2: import("@convex-dev/r2/_generated/component.js").ComponentApi<"r2">;
  auditLog: import("convex-audit-log/_generated/component.js").ComponentApi<"auditLog">;
};
