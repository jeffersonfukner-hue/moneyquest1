import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { ADSENSE_CONFIG } from '@/lib/adsenseConfig';
import { 
  canShowGoogleAds, 
  shouldShowInternalBanners,
  shouldHideAllBanners,
  shouldHideGoogleAds 
} from '@/lib/routeConfig';

export const useAdBanner = () => {
  const { isPremium, loading } = useSubscription();
  const location = useLocation();
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);
  const [adTimedOut, setAdTimedOut] = useState(false);

  // Route context checks (from centralized config)
  const isPublicPage = canShowGoogleAds(location.pathname);
  const isAuthenticatedPage = shouldShowInternalBanners(location.pathname);
  const hideAllBanners = shouldHideAllBanners(location.pathname);
  const hideGoogleAdsOnly = shouldHideGoogleAds(location.pathname);

  // Check if AdSense is properly configured
  const isAdSenseConfigured = Boolean(
    ADSENSE_CONFIG.client && 
    ADSENSE_CONFIG.slots.bottomBanner
  );

  // Show banner for non-premium users on any page EXCEPT /premium-success
  // Internal banners are allowed on ALL pages (public + authenticated + conversion)
  const shouldShowBanner = !loading && !isPremium && !hideAllBanners;
  
  // Google Ads only allowed on public pages that are NOT in the blocked list
  const canShowGoogleAdsOnPage = isPublicPage && isAdSenseConfigured && !hideGoogleAdsOnly;
  
  // Use internal banners when:
  // - On authenticated pages (always internal only)
  // - On conversion pages like /premium, /onboarding (Google blocked)
  // - AdSense not configured
  // - Ad failed to load
  // - Ad timed out (possible ad blocker)
  const showInternalOnly = isAuthenticatedPage || hideGoogleAdsOnly || !isAdSenseConfigured || adError || adTimedOut;

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
