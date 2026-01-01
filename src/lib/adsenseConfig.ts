export const ADSENSE_CONFIG = {
  client: 'ca-pub-7034963198273355',
  slots: {
    // Ad unit slot IDs - configure when created in AdSense dashboard
    bottomBanner: '1234567890', // TODO: Replace with actual slot ID from AdSense
    inFeed: '', // For in-content ads (future)
  },
  // Pages where ads should NEVER appear
  restrictedRoutes: [
    '/login',
    '/signup',
    '/auth',
    '/onboarding',
    '/checkout',
    '/premium',
    '/premium-success',
    '/super-admin',
    '/admin',
  ],
  // Ad detection timeout (ms) - fallback to promo if ad doesn't load
  adLoadTimeout: 3000,
} as const;
