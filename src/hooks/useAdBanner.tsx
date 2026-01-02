import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { ADSENSE_CONFIG } from '@/lib/adsenseConfig';
import { isIndexableRoute } from '@/lib/routeConfig';

export const useAdBanner = () => {
  const { isPremium, loading } = useSubscription();
  const location = useLocation();
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);
  const [adTimedOut, setAdTimedOut] = useState(false);

  // Check if page is indexable (from centralized config)
  const isPageIndexable = isIndexableRoute(location.pathname);

  // Check if AdSense is properly configured
  const isAdSenseConfigured = Boolean(
    ADSENSE_CONFIG.client && 
    ADSENSE_CONFIG.slots.bottomBanner
  );

  // Show banner only for:
  // 1. Page is indexable (public pages)
  // 2. User is NOT premium
  // 3. Not in loading state
  const shouldShowBanner = !loading && !isPremium && isPageIndexable;
  
  // Use fallback if:
  // - AdSense not configured
  // - Ad failed to load
  // - Ad timed out (possible ad blocker)
  const showFallback = !isAdSenseConfigured || adError || adTimedOut;

  // Reset states when route changes
  useEffect(() => {
    setAdLoaded(false);
    setAdError(false);
    setAdTimedOut(false);
  }, [location.pathname]);

  // Timeout detection for ad blockers
  useEffect(() => {
    if (!shouldShowBanner || !isAdSenseConfigured || adLoaded || adError) {
      return;
    }

    const timer = setTimeout(() => {
      if (!adLoaded) {
        console.warn('AdSense: Ad load timeout - possible ad blocker detected');
        setAdTimedOut(true);
      }
    }, ADSENSE_CONFIG.adLoadTimeout);

    return () => clearTimeout(timer);
  }, [shouldShowBanner, isAdSenseConfigured, adLoaded, adError]);

  const handleAdLoaded = useCallback(() => {
    setAdLoaded(true);
    setAdTimedOut(false);
  }, []);

  const handleAdError = useCallback(() => {
    setAdError(true);
  }, []);

  return {
    shouldShowBanner,
    showFallback,
    adLoaded,
    isAdSenseConfigured,
    setAdLoaded: handleAdLoaded,
    setAdError: handleAdError,
  };
};
