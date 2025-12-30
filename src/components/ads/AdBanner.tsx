import { useEffect, useState } from 'react';
import { useAdBanner } from '@/hooks/useAdBanner';
import { useABTest } from '@/hooks/useABTest';
import { AdContainer } from './AdContainer';
import { FallbackPromo } from './FallbackPromo';
import { PremiumBannerModal } from './PremiumBannerModal';
import { ADSENSE_CONFIG } from '@/lib/adsenseConfig';

export const AdBanner = () => {
  const { shouldShowBanner, showFallback, setAdLoaded, setAdError } = useAdBanner();
  const { variant, trackImpression, trackClick } = useABTest('adBanner');
  const [showModal, setShowModal] = useState(false);

  // Track impression when banner is shown
  useEffect(() => {
    if (shouldShowBanner) {
      trackImpression();
    }
  }, [shouldShowBanner, trackImpression]);

  if (!shouldShowBanner) return null;

  // Determine what to show based on A/B test variant
  const showInternalPromo = variant === 'internal_promo' || showFallback;

  const handlePromoClick = () => {
    trackClick({ action: 'upgrade_click' });
  };

  const handleDismissAttempt = () => {
    trackClick({ action: 'dismiss_attempt' });
    setShowModal(true);
  };

  return (
    <>
      <div 
        className="fixed left-0 right-0 z-40 bg-card border-t border-border safe-area-inset-bottom animate-slide-up-fade"
        style={{ bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="max-w-md mx-auto h-[50px] flex items-center">
          {showInternalPromo ? (
            <FallbackPromo onDismiss={handleDismissAttempt} onUpgradeClick={handlePromoClick} />
          ) : (
            <AdContainer 
              adSlot={ADSENSE_CONFIG.slots.bottomBanner}
              adClient={ADSENSE_CONFIG.client}
              onLoad={() => setAdLoaded(true)}
              onError={() => setAdError(true)}
            />
          )}
        </div>
      </div>
      <PremiumBannerModal open={showModal} onOpenChange={setShowModal} />
    </>
  );
};
