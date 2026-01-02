import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { ADSENSE_CONFIG } from '@/lib/adsenseConfig';
import { 
  isIndexableRoute, 
  canShowGoogleAds, 
  shouldShowInternalBanners,
  shouldHideBanner 
} from '@/lib/routeConfig';

export const useAdBanner = () => {
  const { isPremium, loading } = useSubscription();
  const location = useLocation();
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);
  const [adTimedOut, setAdTimedOut] = useState(false);

  // Route context checks (from centralized config)
  const isPageIndexable = isIndexableRoute(location.pathname);
  const isPublicPage = canShowGoogleAds(location.pathname);
  const isAuthenticatedPage = shouldShowInternalBanners(location.pathname);
  const hideBannerOnRoute = shouldHideBanner(location.pathname);

  // Check if AdSense is properly configured
  const isAdSenseConfigured = Boolean(
    ADSENSE_CONFIG.client && 
    ADSENSE_CONFIG.slots.bottomBanner
  );

  // Show banner only for non-premium users
  // On public pages: can show Google Ads or internal banners
  // On authenticated pages: ONLY internal banners
  // Never show on conversion pages (premium, onboarding, etc.)
  const shouldShowBanner = !loading && !isPremium && !hideBannerOnRoute && (isPublicPage || isAuthenticatedPage);
  
  // Google Ads only allowed on public indexable pages
  const canShowGoogleAdsOnPage = isPublicPage && isAdSenseConfigured;
  
  // Use fallback (internal banner) when:
  // - On authenticated pages (always internal only)
  // - AdSense not configured
  // - Ad failed to load
  // - Ad timed out (possible ad blocker)
  const showInternalOnly = isAuthenticatedPage || !isAdSenseConfigured || adError || adTimedOut;

  // Reset states when route changes
  useEffect(() => {
    setAdLoaded(false);
    setAdError(false);
    setAdTimedOut(false);
  }, [location.pathname]);

  // Timeout detection for ad blockers (only on public pages)
  useEffect(() => {
    if (!shouldShowBanner || !canShowGoogleAdsOnPage || adLoaded || adError) {
      return;
    }

    const timer = setTimeout(() => {
      if (!adLoaded) {
        console.warn('AdSense: Ad load timeout - possible ad blocker detected');
        setAdTimedOut(true);
      }
    }, ADSENSE_CONFIG.adLoadTimeout);

    return () => clearTimeout(timer);
  }, [shouldShowBanner, canShowGoogleAdsOnPage, adLoaded, adError]);

  const handleAdLoaded = useCallback(() => {
    setAdLoaded(true);
    setAdTimedOut(false);
  }, []);

  const handleAdError = useCallback(() => {
    setAdError(true);
  }, []);

  return {
    shouldShowBanner,
    showInternalOnly,
    canShowGoogleAdsOnPage,
    isAuthenticatedPage,
    adLoaded,
    isAdSenseConfigured,
    setAdLoaded: handleAdLoaded,
    setAdError: handleAdError,
  };
};
