export const ADSENSE_CONFIG = {
  client: 'ca-pub-7034963198273355',
  slots: {
    bottomBanner: '2872498277',
    inFeed: '',
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
