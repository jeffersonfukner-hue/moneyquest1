import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  BannerType, 
  selectBannerType, 
  selectRandomInternalBanner,
  logBannerDebug 
} from '@/lib/bannerRotationConfig';
import { shouldShowInternalBanners, shouldHideGoogleAds } from '@/lib/routeConfig';

export const useBannerRotation = () => {
  const location = useLocation();
  const isAuthenticatedPage = shouldShowInternalBanners(location.pathname);
  const isGoogleAdsBlocked = shouldHideGoogleAds(location.pathname);
  
  // Determine context: internal banners only on authenticated pages OR when Google is blocked
  const getContext = () => {
    if (isAuthenticatedPage || isGoogleAdsBlocked) return 'authenticated';
    return 'public';
  };
  
  const [currentBanner, setCurrentBanner] = useState<BannerType>(() => 
    selectBannerType(getContext())
  );
  const [rotationReason, setRotationReason] = useState<string>('initial_selection');

  // Recalculate banner on route change
  useEffect(() => {
    const context = getContext();
    const selected = selectBannerType(context);
    setCurrentBanner(selected);
    setRotationReason('route_change');
    logBannerDebug('Route change - reselected', { 
      path: location.pathname, 
      context,
      isGoogleAdsBlocked,
      selected 
    });
  }, [location.pathname, isAuthenticatedPage, isGoogleAdsBlocked]);

  // Fallback when Google Ads fails
  const handleGoogleAdError = useCallback(() => {
    const internalType = selectRandomInternalBanner();
    setCurrentBanner(internalType);
    setRotationReason('google_ad_error');
    logBannerDebug('Google Ad error - fallback', { newType: internalType });
  }, []);

  // Fallback when Google Ads doesn't load (timeout)
  const handleGoogleAdTimeout = useCallback(() => {
    const internalType = selectRandomInternalBanner();
    setCurrentBanner(internalType);
    setRotationReason('google_ad_timeout');
    logBannerDebug('Google Ad timeout - fallback', { newType: internalType });
  }, []);

  return {
    currentBanner,
    rotationReason,
    handleGoogleAdError,
    handleGoogleAdTimeout,
    isGoogleAd: currentBanner === 'google',
    isInternalBanner: currentBanner.startsWith('internal_'),
    isReferralBanner: currentBanner === 'internal_referral',
    isPremiumBanner: currentBanner === 'internal_premium',
    isAuthenticatedPage,
  };
};
