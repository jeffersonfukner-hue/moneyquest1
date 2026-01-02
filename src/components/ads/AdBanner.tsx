import { useEffect, useState } from 'react';
import { useAdBanner } from '@/hooks/useAdBanner';
import { useBannerRotation } from '@/hooks/useBannerRotation';
import { useABTest } from '@/hooks/useABTest';
import { AdContainer } from './AdContainer';
import { FallbackPromo } from './FallbackPromo';
import { ReferralBanner } from './ReferralBanner';
import { PremiumTrialBanner } from './PremiumTrialBanner';
import { PremiumBannerModal } from './PremiumBannerModal';
import { ADSENSE_CONFIG } from '@/lib/adsenseConfig';
import { logBannerDebug } from '@/lib/bannerRotationConfig';

export const AdBanner = () => {
  const { 
    shouldShowBanner, 
    isAdSenseConfigured,
    setAdLoaded, 
    setAdError 
  } = useAdBanner();
  
  const { 
    currentBanner, 
    rotationReason, 
    handleGoogleAdError,
    handleGoogleAdTimeout,
    isGoogleAd 
  } = useBannerRotation();
  
  const { trackImpression, trackClick } = useABTest('adBanner');
  const [showModal, setShowModal] = useState(false);

  // Track impression when banner is shown
  useEffect(() => {
    if (shouldShowBanner) {
      trackImpression();
      logBannerDebug('Impression', { bannerType: currentBanner, reason: rotationReason });
    }
  }, [shouldShowBanner, trackImpression, currentBanner, rotationReason]);

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

  // Renderizar banner baseado no tipo selecionado pela rotação
  const renderBanner = () => {
    // Se Google Ads foi selecionado MAS não está configurado, usar fallback interno
    if (isGoogleAd && !isAdSenseConfigured) {
      logBannerDebug('Google selected but not configured', { fallback: 'FallbackPromo' });
      return <FallbackPromo onDismiss={handleDismissAttempt} onUpgradeClick={handlePromoClick} />;
    }

    switch (currentBanner) {
      case 'google':
        return (
          <AdContainer 
            adSlot={ADSENSE_CONFIG.slots.bottomBanner}
            adClient={ADSENSE_CONFIG.client}
            onLoad={setAdLoaded}
            onError={handleGoogleError}
          />
        );
      case 'internal_referral':
        return <ReferralBanner onDismiss={handleDismissAttempt} />;
      case 'internal_premium':
        return <PremiumTrialBanner onDismiss={handleDismissAttempt} />;
      default:
        return <FallbackPromo onDismiss={handleDismissAttempt} onUpgradeClick={handlePromoClick} />;
    }
  };

  return (
    <>
      <div 
        className="fixed left-0 right-0 z-40 bg-card border-t border-border safe-area-inset-bottom animate-slide-up-fade"
        style={{ bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="max-w-md mx-auto h-[60px] flex items-center">
          {renderBanner()}
        </div>
      </div>
      <PremiumBannerModal open={showModal} onOpenChange={setShowModal} />
    </>
  );
};
