/**
 * Banner Rotation Configuration
 * Controls the weighted distribution of banner types based on context
 */

export type BannerType = 'google' | 'internal_referral' | 'internal_premium';
export type BannerContext = 'public' | 'authenticated';

interface BannerRotationConfig {
  // Distribution for public pages (Google Ads allowed)
  publicDistribution: {
    google: number; // 70%
    internal: number; // 30%
  };
  // Distribution for authenticated pages (only internal banners)
  authenticatedDistribution: {
    referral: number; // 50%
    premium: number; // 50%
  };
  // Internal banner distribution (when internal is selected on public pages)
  internalDistribution: {
    referral: number; // 50%
    premium: number; // 50%
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
    referral: 50,
    premium: 50,
  },
  internalDistribution: {
    referral: 50,
    premium: 50,
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
 */
const selectInternalBanner = (distribution: { referral: number; premium: number }): BannerType => {
  const random = Math.random() * 100;
  
  if (random < distribution.referral) {
    logBannerDebug('Selected', { type: 'internal_referral', random: random.toFixed(2) });
    return 'internal_referral';
  }
  
  logBannerDebug('Selected', { type: 'internal_premium', random: random.toFixed(2) });
  return 'internal_premium';
};

/**
 * Select banner type based on context
 * @param context 'public' for indexable pages, 'authenticated' for logged-in pages
 */
export const selectBannerType = (context: BannerContext = 'public'): BannerType => {
  // If debug forced, use specific type
  if (BANNER_ROTATION_CONFIG.debug.enabled && BANNER_ROTATION_CONFIG.debug.forceType) {
    // On authenticated pages, don't allow forcing google
    if (context === 'authenticated' && BANNER_ROTATION_CONFIG.debug.forceType === 'google') {
      logBannerDebug('Forced type blocked (no google on authenticated)', { context });
      return selectInternalBanner(BANNER_ROTATION_CONFIG.authenticatedDistribution);
    }
    logBannerDebug('Forced type', { type: BANNER_ROTATION_CONFIG.debug.forceType });
    return BANNER_ROTATION_CONFIG.debug.forceType;
  }
  
  // For authenticated pages: only internal banners (no Google Ads)
  if (context === 'authenticated') {
    return selectInternalBanner(BANNER_ROTATION_CONFIG.authenticatedDistribution);
  }
  
  // For public pages: 70% Google Ads, 30% Internal banners
  const random = Math.random() * 100;
  
  if (random < BANNER_ROTATION_CONFIG.publicDistribution.google) {
    logBannerDebug('Selected', { type: 'google', random: random.toFixed(2) });
    return 'google';
  }
  
  return selectInternalBanner(BANNER_ROTATION_CONFIG.internalDistribution);
};

/**
 * Select a random internal banner (used as fallback when Google Ads fail)
 */
export const selectRandomInternalBanner = (): BannerType => {
  return selectInternalBanner(BANNER_ROTATION_CONFIG.internalDistribution);
};
