/**
 * Google AdSense Configuration
 * Route restrictions are now handled by src/lib/routeConfig.ts
 */
export const ADSENSE_CONFIG = {
  client: 'ca-pub-7034963198273355',
  slots: {
    bottomBanner: '2872498277',
    inFeed: '',
  },
  // Ad detection timeout (ms) - fallback to promo if ad doesn't load
  adLoadTimeout: 3000,
} as const;
