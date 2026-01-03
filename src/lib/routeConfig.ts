/**
 * Centralized Route Configuration
 * Single source of truth for SEO indexing, ad display rules, and route context
 */

// Public pages that SHOULD be indexed by Google
// These are the ONLY pages where Google AdSense can be displayed
export const INDEXABLE_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/features',
  '/premium',
  '/terms',
  '/privacy',
] as const;

export type IndexableRoute = typeof INDEXABLE_ROUTES[number];

// Authenticated pages (restricted - no Google AdSense)
// Only internal banners (Premium/Referral) are allowed here
export const AUTHENTICATED_ROUTES = [
  '/dashboard',
  '/transactions',
  '/wallets',
  '/categories',
  '/goals',
  '/settings',
  '/profile',
  '/ai-coach',
  '/leaderboard',
  '/journal',
  '/quests',
  '/cash-flow',
  '/period-comparison',
  '/referral',
  '/notifications',
  '/support',
  '/onboarding',
  '/upgrade',
  '/premium-success',
  '/my-messages',
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
 * @deprecated Use shouldHideAllBanners instead
 */
export const shouldHideBanner = shouldHideAllBanners;
