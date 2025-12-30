export const ADSENSE_CONFIG = {
  client: 'ca-pub-7034963198273355',
  slots: {
    bottomBanner: '', // Add your ad unit slot ID when created in AdSense dashboard
  },
  // Pages where ads should NEVER appear
  restrictedRoutes: [
    '/login',
    '/signup',
    '/onboarding',
    '/checkout',
    '/premium',
    '/super-admin',
  ],
} as const;
