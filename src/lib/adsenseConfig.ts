export const ADSENSE_CONFIG = {
  client: 'ca-pub-7034963198273355',
  slots: {
    bottomBanner: '2872498277',
    inFeed: '',
  },
  // Pages where ads should NEVER appear (auth flows + noIndex pages)
  restrictedRoutes: [
    // Auth/checkout flows
    '/login',
    '/signup',
    '/auth',
    '/onboarding',
    '/checkout',
    
    // Premium pages
    '/premium',
    '/premium-success',
    '/upgrade',
    
    // Admin pages
    '/super-admin',
    '/admin',
    
    // Authenticated pages (noIndex in SEO)
    '/ai-coach',
    '/category-goals',
    '/categories',
    '/leaderboard',
    '/journal',
    '/wallets',
    '/cash-flow',
    '/period-comparison',
    '/referral',
    '/notifications',
    '/support',
    '/settings',
    '/profile',
    '/my-messages',
  ],
  // Ad detection timeout (ms) - fallback to promo if ad doesn't load
  adLoadTimeout: 3000,
} as const;
