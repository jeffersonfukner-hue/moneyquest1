import { useAdBanner } from '@/hooks/useAdBanner';
import { AdContainer } from './AdContainer';
import { FallbackPromo } from './FallbackPromo';
import { ADSENSE_CONFIG } from '@/lib/adsenseConfig';

export const AdBanner = () => {
  const { shouldShowBanner, showFallback, setAdLoaded, setAdError, dismiss } = useAdBanner();

  if (!shouldShowBanner) return null;

  return (
    <div 
      className="fixed left-0 right-0 z-40 bg-card border-t border-border safe-area-inset-bottom"
      style={{ bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="max-w-md mx-auto h-[50px] flex items-center">
        {showFallback ? (
          <FallbackPromo onDismiss={dismiss} />
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
  );
};
