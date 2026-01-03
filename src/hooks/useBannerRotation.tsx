import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  BannerType, 
  selectBannerType, 
  selectRandomInternalBanner,
  logBannerDebug 
} from '@/lib/bannerRotationConfig';
import { shouldShowInternalBanners, shouldHideGoogleAds } from '@/lib/routeConfig';
import { useCampaigns, Campaign } from '@/hooks/useCampaigns';

export const useBannerRotation = () => {
  const location = useLocation();
  const isAuthenticatedPage = shouldShowInternalBanners(location.pathname);
  const isGoogleAdsBlocked = shouldHideGoogleAds(location.pathname);
  const { campaigns, hasCampaigns, getRandomCampaign, isLoading: campaignsLoading } = useCampaigns();
  
  // Determine context: internal banners only on authenticated pages OR when Google is blocked
  const getContext = () => {
    if (isAuthenticatedPage || isGoogleAdsBlocked) return 'authenticated';
    return 'public';
  };
  
  const [currentBanner, setCurrentBanner] = useState<BannerType>(() => 
    selectBannerType(getContext(), false) // Initially no campaigns
  );
  const [rotationReason, setRotationReason] = useState<string>('initial_selection');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  // Recalculate banner on route change or when campaigns load
  useEffect(() => {
    if (campaignsLoading) return;
    
    const context = getContext();
    const selected = selectBannerType(context, hasCampaigns);
    setCurrentBanner(selected);
    setRotationReason('route_change');
    
    // If campaign banner was selected, pick a random campaign
    if (selected === 'internal_campaign' && hasCampaigns) {
      setSelectedCampaign(getRandomCampaign());
    } else {
      setSelectedCampaign(null);
    }
    
    logBannerDebug('Route change - reselected', { 
      path: location.pathname, 
      context,
      isGoogleAdsBlocked,
      hasCampaigns,
      selected 
    });
  }, [location.pathname, isAuthenticatedPage, isGoogleAdsBlocked, hasCampaigns, campaignsLoading]);

  // Fallback when Google Ads fails
  const handleGoogleAdError = useCallback(() => {
    const internalType = selectRandomInternalBanner(hasCampaigns);
    setCurrentBanner(internalType);
    setRotationReason('google_ad_error');
    
    if (internalType === 'internal_campaign' && hasCampaigns) {
      setSelectedCampaign(getRandomCampaign());
    }
    
    logBannerDebug('Google Ad error - fallback', { newType: internalType });
  }, [hasCampaigns, getRandomCampaign]);

  // Fallback when Google Ads doesn't load (timeout)
  const handleGoogleAdTimeout = useCallback(() => {
    const internalType = selectRandomInternalBanner(hasCampaigns);
    setCurrentBanner(internalType);
    setRotationReason('google_ad_timeout');
    
    if (internalType === 'internal_campaign' && hasCampaigns) {
      setSelectedCampaign(getRandomCampaign());
    }
    
    logBannerDebug('Google Ad timeout - fallback', { newType: internalType });
  }, [hasCampaigns, getRandomCampaign]);

  return {
    currentBanner,
    rotationReason,
    handleGoogleAdError,
    handleGoogleAdTimeout,
    isGoogleAd: currentBanner === 'google',
    isInternalBanner: currentBanner.startsWith('internal_'),
    isReferralBanner: currentBanner === 'internal_referral',
    isPremiumBanner: currentBanner === 'internal_premium',
    isCampaignBanner: currentBanner === 'internal_campaign',
    selectedCampaign,
    hasCampaigns,
    isAuthenticatedPage,
  };
};
