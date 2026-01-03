import { useEffect, useState } from 'react';
import { useAdBanner } from '@/hooks/useAdBanner';
import { useBannerRotation } from '@/hooks/useBannerRotation';
import { useABTest } from '@/hooks/useABTest';
import { useAdSenseLoader } from '@/hooks/useAdSenseLoader';
import { AdContainer } from './AdContainer';
import { FallbackPromo } from './FallbackPromo';
import { ReferralBanner } from './ReferralBanner';
import { PremiumInternalBanner } from './PremiumInternalBanner';
import { PremiumBannerModal } from './PremiumBannerModal';
import { ADSENSE_CONFIG } from '@/lib/adsenseConfig';
import { logBannerDebug } from '@/lib/bannerRotationConfig';

export const AdBanner = () => {
  const { 
    shouldShowBanner, 
    showInternalOnly,
    canShowGoogleAdsOnPage,
    isAuthenticatedPage,
    isAdSenseConfigured,
    setAdLoaded, 
    setAdError 
  } = useAdBanner();
  
  const { 
    currentBanner, 
    rotationReason, 
    handleGoogleAdError,
    isGoogleAd 
  } = useBannerRotation();
  
  const { trackImpression, trackClick } = useABTest('adBanner');
  const [showModal, setShowModal] = useState(false);
  
  // Load AdSense script dynamically only on public pages
  useAdSenseLoader();

  // Track impression when banner is shown
  useEffect(() => {
    if (shouldShowBanner) {
      trackImpression();
      logBannerDebug('Impression', { 
        bannerType: currentBanner, 
        reason: rotationReason,
        isAuthenticatedPage,
        showInternalOnly 
      });
    }
  }, [shouldShowBanner, trackImpression, currentBanner, rotationReason, isAuthenticatedPage, showInternalOnly]);

  if (!shouldShowBanner) return null;

  const handleDismissAttempt = () => {
    trackClick({ action: 'dismiss_attempt' });
    setShowModal(true);
  };

  const handlePromoClick = () => {
    trackClick({ action: 'upgrade_click' });
  };

  const handleGoogleError = () => {
    setAdError();
    handleGoogleAdError();
    logBannerDebug('Google Ad error - switching to internal', { currentBanner });
  };

  // Render banner based on context and rotation selection
  // Always returns a valid banner - never null (prevents empty container)
  const renderBanner = (): React.ReactNode => {
    // When internal banners should be shown (authenticated pages, conversion pages, errors)
    if (showInternalOnly) {
      logBannerDebug('Rendering internal banner', { 
        isAuthenticatedPage, 
        showInternalOnly, 
        bannerType: currentBanner 
      });
      
      // Respect the rotation selection for internal banners
      if (currentBanner === 'internal_referral') {
        return <ReferralBanner onDismiss={handleDismissAttempt} />;
      }
      // PremiumInternalBanner as default/fallback
      return <PremiumInternalBanner onDismiss={handleDismissAttempt} />;
    }

    // On public pages: can show Google Ads or internal banners based on rotation
    if (isGoogleAd && canShowGoogleAdsOnPage) {
      return (
        <AdContainer 
          adSlot={ADSENSE_CONFIG.slots.bottomBanner}
          adClient={ADSENSE_CONFIG.client}
          onLoad={setAdLoaded}
          onError={handleGoogleError}
        />
      );
    }

    // Internal banner selected on public page
    if (currentBanner === 'internal_referral') {
      return <ReferralBanner onDismiss={handleDismissAttempt} />;
    }
    if (currentBanner === 'internal_premium') {
      return <PremiumInternalBanner onDismiss={handleDismissAttempt} />;
    }
    
    // FallbackPromo as ultimate fallback on public pages
    return <FallbackPromo onDismiss={handleDismissAttempt} onUpgradeClick={handlePromoClick} />;
  };

  const bannerContent = renderBanner();

  return (
    <>
      <div 
        className="fixed left-0 right-0 z-40 bg-card border-t border-border safe-area-inset-bottom animate-slide-up-fade"
        style={{ bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="max-w-md mx-auto h-[60px] flex items-center">
          {bannerContent}
        </div>
      </div>
      <PremiumBannerModal open={showModal} onOpenChange={setShowModal} />
    </>
  );
};
