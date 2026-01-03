/**
 * Banner Rotation Configuration
 * Controls the weighted distribution of banner types based on context
 */

export type BannerType = 'google' | 'internal_referral' | 'internal_premium' | 'internal_campaign';
export type BannerContext = 'public' | 'authenticated';

interface BannerRotationConfig {
  // Distribution for public pages (Google Ads allowed)
  publicDistribution: {
    google: number; // 70%
    internal: number; // 30%
  };
  // Distribution for authenticated pages (only internal banners)
  // When campaigns are active, they get included in rotation
  authenticatedDistribution: {
    referral: number; // 40%
    premium: number; // 40%
    campaign: number; // 20% (only used when campaigns exist)
  };
  // Internal banner distribution (when internal is selected on public pages)
  internalDistribution: {
    referral: number; // 40%
    premium: number; // 40%
    campaign: number; // 20% (only used when campaigns exist)
  };
  // Debug settings
  debug: {
    enabled: boolean;
    forceType: BannerType | null;
    logEnabled: boolean;
  };
}

export const BANNER_ROTATION_CONFIG: BannerRotationConfig = {
  publicDistribution: {
    google: 70,
    internal: 30,
  },
  authenticatedDistribution: {
    referral: 40,
    premium: 40,
    campaign: 20,
  },
  internalDistribution: {
    referral: 40,
    premium: 40,
    campaign: 20,
  },
  debug: {
    enabled: false,
    forceType: null,
    logEnabled: import.meta.env.DEV,
  },
};

/**
 * Logs banner debug information if logging is enabled
 */
export const logBannerDebug = (action: string, details: Record<string, unknown>) => {
  if (!BANNER_ROTATION_CONFIG.debug.logEnabled) return;
  
  console.log(
    `%c[BannerRotation] ${action}`,
    'color: #9333ea; font-weight: bold;',
    {
      timestamp: new Date().toISOString(),
      ...details,
    }
  );
};

// Expose debug controls to window for development testing
if (typeof window !== 'undefined') {
  (window as unknown as { setBannerDebug: (type: BannerType | null) => void }).setBannerDebug = (
    type: BannerType | null
  ) => {
    BANNER_ROTATION_CONFIG.debug.enabled = type !== null;
    BANNER_ROTATION_CONFIG.debug.forceType = type;
    console.log('%c[BannerRotation] Debug mode:', 'color: #9333ea; font-weight: bold;', type ? `Forcing ${type}` : 'Disabled');
  };
}

/**
 * Helper to select between internal banner types
 * @param distribution Distribution weights
 * @param hasCampaigns Whether there are active campaigns to show
 */
const selectInternalBanner = (
  distribution: { referral: number; premium: number; campaign: number },
  hasCampaigns: boolean = false
): BannerType => {
  const random = Math.random() * 100;
  
  // If no campaigns, redistribute campaign weight to referral/premium
  const effectiveDistribution = hasCampaigns 
    ? distribution
    : { 
        referral: distribution.referral + distribution.campaign / 2, 
        premium: distribution.premium + distribution.campaign / 2,
        campaign: 0 
      };
  
  if (random < effectiveDistribution.referral) {
    logBannerDebug('Selected', { type: 'internal_referral', random: random.toFixed(2), hasCampaigns });
    return 'internal_referral';
  }
  
  if (random < effectiveDistribution.referral + effectiveDistribution.premium) {
    logBannerDebug('Selected', { type: 'internal_premium', random: random.toFixed(2), hasCampaigns });
    return 'internal_premium';
  }
  
  if (hasCampaigns) {
    logBannerDebug('Selected', { type: 'internal_campaign', random: random.toFixed(2), hasCampaigns });
    return 'internal_campaign';
  }
  
  // Fallback to premium
  logBannerDebug('Selected (fallback)', { type: 'internal_premium', random: random.toFixed(2) });
  return 'internal_premium';
};

/**
 * Select banner type based on context
 * @param context 'public' for indexable pages, 'authenticated' for logged-in pages
 * @param hasCampaigns Whether there are active campaigns to show
 */
export const selectBannerType = (context: BannerContext = 'public', hasCampaigns: boolean = false): BannerType => {
  // If debug forced, use specific type
  if (BANNER_ROTATION_CONFIG.debug.enabled && BANNER_ROTATION_CONFIG.debug.forceType) {
    // On authenticated pages, don't allow forcing google
    if (context === 'authenticated' && BANNER_ROTATION_CONFIG.debug.forceType === 'google') {
      logBannerDebug('Forced type blocked (no google on authenticated)', { context });
      return selectInternalBanner(BANNER_ROTATION_CONFIG.authenticatedDistribution, hasCampaigns);
    }
    // Don't allow forcing campaign if no campaigns
    if (BANNER_ROTATION_CONFIG.debug.forceType === 'internal_campaign' && !hasCampaigns) {
      logBannerDebug('Forced type blocked (no campaigns)', { context });
      return 'internal_premium';
    }
    logBannerDebug('Forced type', { type: BANNER_ROTATION_CONFIG.debug.forceType });
    return BANNER_ROTATION_CONFIG.debug.forceType;
  }
  
  // For authenticated pages: only internal banners (no Google Ads)
  if (context === 'authenticated') {
    return selectInternalBanner(BANNER_ROTATION_CONFIG.authenticatedDistribution, hasCampaigns);
  }
  
  // For public pages: 70% Google Ads, 30% Internal banners
  const random = Math.random() * 100;
  
  if (random < BANNER_ROTATION_CONFIG.publicDistribution.google) {
    logBannerDebug('Selected', { type: 'google', random: random.toFixed(2) });
    return 'google';
  }
  
  return selectInternalBanner(BANNER_ROTATION_CONFIG.internalDistribution, hasCampaigns);
};

/**
 * Select a random internal banner (used as fallback when Google Ads fail)
 * @param hasCampaigns Whether there are active campaigns to show
 */
export const selectRandomInternalBanner = (hasCampaigns: boolean = false): BannerType => {
  return selectInternalBanner(BANNER_ROTATION_CONFIG.internalDistribution, hasCampaigns);
};
