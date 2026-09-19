// SVELTEKIT IMPORTS
import { resolve } from '$app/paths';

export const UNPROTECTED_PAGE_ENDPOINTS = {
	ROOT: resolve('/'),
	SIGN_IN: resolve('/sign-in'),
	SIGN_UP: resolve('/sign-up'),
	VERIFY_EMAIL: resolve('/verify-email'),
	FORGOT_PASSWORD: resolve('/forgot-password'),
	AUTH_ERROR: resolve('/auth/error'),
	CHECKOUT: resolve('/checkout'),
	MY_ORDERS: resolve('/my-orders'),
	MY_ORDER: (code: string) => resolve('/(app)/(unprotected)/my-orders/[code]', { code }),
	SHOP: resolve('/shop'),
	CONTACT: resolve('/(app)/(unprotected)/contact'),
	PRODUCT: (slug: string) => resolve('/(app)/(unprotected)/product/[slug]', { slug })
};

export const ADMIN_PAGE_ENDPOINTS = {
	UPSELLS: resolve('/admin/upsells'),
	PRODUCTS: resolve('/admin/products'),
	ADD_PRODUCT: resolve('/admin/products/add-product'),
	EDIT_PRODUCT: (id: string) => resolve('/admin/products/edit-product/[id]', { id }),
	CATEGORIES: resolve('/admin/categories'),
	ADD_CATEGORY: resolve('/admin/categories/add-category'),
	EDIT_CATEGORY: (id: string) => resolve('/admin/categories/edit-category/[id]', { id }),
	ORDERS: resolve('/admin/orders'),
	EDIT_ORDER: (id: string) => resolve('/admin/orders/edit-order/[id]', { id }),
	DASHBOARD: resolve('/admin/dashboard')
};
