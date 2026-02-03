/**
 * Centralized Route Configuration
 * Single source of truth for SEO indexing, ad display rules, and route context
 * 
 * NOTE: For route constants, import from '@/routes/routes' instead.
 * This file is specifically for SEO and ad display configuration.
 */

import { APP_ROUTES, PUBLIC_ROUTES } from '@/routes/routes';

// Public pages that SHOULD be indexed by Google
// These are the ONLY pages where Google AdSense can be displayed
// NOTE: /login and /signup are intentionally NOT indexable (noindex via meta robots)
export const INDEXABLE_ROUTES = [
  PUBLIC_ROUTES.HOME,
  PUBLIC_ROUTES.ABOUT,
  PUBLIC_ROUTES.FEATURES,
  PUBLIC_ROUTES.TERMS,
  PUBLIC_ROUTES.PRIVACY,
  PUBLIC_ROUTES.BLOG,
  PUBLIC_ROUTES.AUTHOR,
  PUBLIC_ROUTES.CONTROLE_FINANCEIRO,
  PUBLIC_ROUTES.EDUCACAO_FINANCEIRA,
  PUBLIC_ROUTES.DESAFIOS_FINANCEIROS,
  PUBLIC_ROUTES.APP_FINANCAS,
] as const;

// Routes that are public but should NOT be indexed (noindex, follow)
// These pages are accessible but excluded from search results
export const NOINDEX_PUBLIC_ROUTES = [
  PUBLIC_ROUTES.LOGIN,
  PUBLIC_ROUTES.SIGNUP,
  APP_ROUTES.UPGRADE,
  PUBLIC_ROUTES.REFERRAL_REDIRECT,
  PUBLIC_ROUTES.SELECT_LANGUAGE,
] as const;

export type IndexableRoute = typeof INDEXABLE_ROUTES[number];

// Authenticated pages (restricted - no Google AdSense)
// Only internal banners (Premium/Referral) are allowed here
export const AUTHENTICATED_ROUTES = [
  APP_ROUTES.DASHBOARD,
  APP_ROUTES.WALLETS,
  APP_ROUTES.WALLETS_ACCOUNTS,
  APP_ROUTES.WALLETS_CARDS,
  APP_ROUTES.WALLETS_LOANS,
  APP_ROUTES.WALLETS_TRANSFERS,
  APP_ROUTES.CATEGORIES,
  APP_ROUTES.GOALS,
  APP_ROUTES.SETTINGS,
  APP_ROUTES.PROFILE,
  APP_ROUTES.REPORTS,
  APP_ROUTES.REFERRAL,
  APP_ROUTES.NOTIFICATIONS,
  APP_ROUTES.SUPPORT,
  APP_ROUTES.ONBOARDING,
  APP_ROUTES.UPGRADE,
  APP_ROUTES.PREMIUM_SUCCESS,
  APP_ROUTES.MY_MESSAGES,
  APP_ROUTES.SCHEDULED,
  APP_ROUTES.SUPPLIERS,
] as const;

export type AuthenticatedRoute = typeof AUTHENTICATED_ROUTES[number];

/**
 * Check if a route should be indexed by search engines
 * Returns true for public pages, false for authenticated/private pages
 */
export const isIndexableRoute = (pathname: string): boolean => {
  return INDEXABLE_ROUTES.some(
    route => pathname === route || (route !== '/' && pathname.startsWith(`${route}/`))
  );
};

/**
 * Check if a route is restricted (noIndex)
 * Inverse of isIndexableRoute - used for SEO meta tags
 */
export const isRestrictedRoute = (pathname: string): boolean => {
  return !isIndexableRoute(pathname);
};

/**
 * Check if a route requires authentication
 * Used to determine which banner type to show
 */
export const isAuthenticatedRoute = (pathname: string): boolean => {
  return AUTHENTICATED_ROUTES.some(
    route => pathname === route || pathname.startsWith(`${route}/`)
  );
};

/**
 * Check if Google Ads can be shown on a route
 * Only allowed on public indexable pages
 */
export const canShowGoogleAds = (pathname: string): boolean => {
  return isIndexableRoute(pathname) && !isAuthenticatedRoute(pathname);
};

/**
 * Check if internal banners (Premium/Referral) should be shown
 * Shown on authenticated pages for free users
 */
export const shouldShowInternalBanners = (pathname: string): boolean => {
  return isAuthenticatedRoute(pathname);
};

// Routes where Google Ads are blocked (but internal banners allowed)
export const GOOGLE_ADS_BLOCKED_ROUTES = [
  '/premium',
  '/onboarding',
  '/upgrade',
] as const;

// Routes where ALL banners should be hidden (post-payment celebration)
export const NO_BANNER_ROUTES = [
  '/premium-success',
] as const;

/**
 * Check if a route should hide Google Ads only
 * Internal banners are still allowed on these routes
 */
export const shouldHideGoogleAds = (pathname: string): boolean => {
  return GOOGLE_ADS_BLOCKED_ROUTES.some(
    route => pathname === route || pathname.startsWith(`${route}/`)
  );
};

/**
 * Check if a route should hide ALL banners
 * Only used for /premium-success where user just paid
 */
export const shouldHideAllBanners = (pathname: string): boolean => {
  return NO_BANNER_ROUTES.some(
    route => pathname === route || pathname.startsWith(`${route}/`)
  );
};

/**
 * Check if Google Ads can be shown on blog pages
 * More restrictive - ONLY blog pages, for non-authenticated users
 */
export const canShowBlogAds = (pathname: string): boolean => {
  return pathname === '/blog' || pathname.startsWith('/blog/');
};

/**
 * @deprecated Use shouldHideAllBanners instead
 */
export const shouldHideBanner = shouldHideAllBanners;
