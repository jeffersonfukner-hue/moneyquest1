/**
 * Centralized Route Configuration
 * Single source of truth for SEO indexing and ad display rules
 */

// Public pages that SHOULD be indexed by Google
// These are the ONLY pages that can display ads for free users
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
