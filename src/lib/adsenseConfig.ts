/**
 * Google AdSense Configuration
 * Route restrictions are now handled by src/lib/routeConfig.ts
 * 
 * IMPORTANT: Google Ads are ONLY displayed on public blog pages
 * for non-authenticated users. See useBlogAdSense hook.
 */
export const ADSENSE_CONFIG = {
  client: 'ca-pub-7034963198273355',
  slots: {
    // Legacy slots (kept for compatibility)
    bottomBanner: '2872498277',
    inFeed: '',
    // Blog-specific slots
    blogHeader: '5164222337',      // Below article title
    blogInArticle: '7048999707',   // Mid-content (in-article format)
    blogFooter: '4210233313',      // After article content
  },
  // Ad detection timeout (ms) - fallback to promo if ad doesn't load
  adLoadTimeout: 3000,
} as const;
