import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/hooks/useAuth';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { ADSENSE_CONFIG } from '@/lib/adsenseConfig';
import { 
  canShowGoogleAds, 
  shouldShowInternalBanners,
  shouldHideAllBanners,
  shouldHideGoogleAds 
} from '@/lib/routeConfig';

const BANNER_DISMISSED_KEY = 'moneyquest_banner_dismissed_date';

/**
 * Check if banner was already dismissed today
 */
const wasBannerDismissedToday = (): boolean => {
  const dismissedDate = localStorage.getItem(BANNER_DISMISSED_KEY);
  if (!dismissedDate) return false;
  
  const today = new Date().toISOString().split('T')[0];
  return dismissedDate === today;
};

/**
 * Mark banner as dismissed for today
 */
const markBannerDismissedToday = (): void => {
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem(BANNER_DISMISSED_KEY, today);
};

export const useAdBanner = () => {
  const { isPremium, loading } = useSubscription();
  const { user } = useAuth();
  const { isInTrial, hasPaidSubscription } = useTrialStatus();
  const location = useLocation();
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);
  const [adTimedOut, setAdTimedOut] = useState(false);
  const [bannerDismissedToday, setBannerDismissedToday] = useState(false);

  // Check if user is authenticated - ALWAYS use internal banners when logged in
  const isUserAuthenticated = !!user;

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

  // Check dismissed status on mount
  useEffect(() => {
    setBannerDismissedToday(wasBannerDismissedToday());
  }, []);

  // Calculate if internal premium/referral banners should be suppressed
  // Rules:
  // 1. During trial period: NEVER show internal banners
  // 2. After trial expired: Show only once per day
  // 3. Public pages (not logged in): Show Google Ads normally
  const shouldSuppressInternalBanner = useMemo(() => {
    // Not authenticated = public page, show ads normally
    if (!isUserAuthenticated) return false;
    
    // User is in trial period = don't show internal banners
    if (isInTrial) return true;
    
    // User has paid subscription = don't show internal banners (isPremium already handles this)
    if (hasPaidSubscription) return true;
    
    // Trial expired: check if already shown today
    if (bannerDismissedToday) return true;
    
    return false;
  }, [isUserAuthenticated, isInTrial, hasPaidSubscription, bannerDismissedToday]);

  // Show banner for non-premium users on any page EXCEPT:
  // - /premium-success
  // - During trial period (for authenticated users)
  // - Already dismissed today (for authenticated users)
  const shouldShowBanner = useMemo(() => {
    if (loading) return false;
    if (isPremium) return false;
    if (hideAllBanners) return false;
    
    // For authenticated users, respect trial and daily limit
    if (isUserAuthenticated && shouldSuppressInternalBanner) {
      return false;
    }
    
    return true;
  }, [loading, isPremium, hideAllBanners, isUserAuthenticated, shouldSuppressInternalBanner]);
  
  // Google Ads only allowed on public pages AND user NOT logged in
  const canShowGoogleAdsOnPage = isPublicPage && isAdSenseConfigured && !hideGoogleAdsOnly && !isUserAuthenticated;
  
  // Use internal banners when:
  // - User is logged in (ALWAYS internal for authenticated users)
  // - On authenticated pages (always internal only)
  // - On conversion pages like /premium, /onboarding (Google blocked)
  // - AdSense not configured
  // - Ad failed to load
  // - Ad timed out (possible ad blocker)
  const showInternalOnly = isUserAuthenticated || isAuthenticatedPage || hideGoogleAdsOnly || !isAdSenseConfigured || adError || adTimedOut;

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

  // Mark banner as dismissed for today (called when user interacts with dismiss)
  const dismissBannerForToday = useCallback(() => {
    markBannerDismissedToday();
    setBannerDismissedToday(true);
  }, []);

  return {
    shouldShowBanner,
    showInternalOnly,
    canShowGoogleAdsOnPage,
    isAuthenticatedPage,
    adLoaded,
    isAdSenseConfigured,
    isInTrial,
    setAdLoaded: handleAdLoaded,
    setAdError: handleAdError,
    dismissBannerForToday,
  };
};
