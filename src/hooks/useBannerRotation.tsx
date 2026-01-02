import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  BannerType, 
  selectBannerType, 
  selectRandomInternalBanner,
  logBannerDebug 
} from '@/lib/bannerRotationConfig';

export const useBannerRotation = () => {
  const location = useLocation();
  const [currentBanner, setCurrentBanner] = useState<BannerType>(() => selectBannerType());
  const [rotationReason, setRotationReason] = useState<string>('initial_selection');

  // Recalcula banner a cada mudança de rota
  useEffect(() => {
    const selected = selectBannerType();
    setCurrentBanner(selected);
    setRotationReason('route_change');
    logBannerDebug('Route change - reselected', { 
      path: location.pathname, 
      selected 
    });
  }, [location.pathname]);

  // Fallback quando Google Ads falha
  const handleGoogleAdError = useCallback(() => {
    const internalType = selectRandomInternalBanner();
    setCurrentBanner(internalType);
    setRotationReason('google_ad_error');
    logBannerDebug('Google Ad error - fallback', { newType: internalType });
  }, []);

  // Fallback quando Google Ads não carrega (timeout)
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
  };
};
