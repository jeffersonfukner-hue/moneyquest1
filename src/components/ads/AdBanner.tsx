import { useAdBanner } from '@/hooks/useAdBanner';
import { AdContainer } from './AdContainer';
import { FallbackPromo } from './FallbackPromo';

interface AdBannerProps {
  // Optional AdSense configuration - when ready, pass these props
  adSlot?: string;
  adClient?: string;
}

export const AdBanner = ({ adSlot, adClient }: AdBannerProps) => {
  const { shouldShowBanner, showFallback, setAdLoaded, setAdError, dismiss } = useAdBanner();

  if (!shouldShowBanner) return null;

  return (
    <div 
      className="fixed left-0 right-0 z-40 bg-card border-t border-border"
      style={{ bottom: '64px' }} // Above the bottom navigation (h-16 = 64px)
    >
      <div className="max-w-md mx-auto h-[50px] flex items-center">
        {showFallback ? (
          <FallbackPromo onDismiss={dismiss} />
        ) : (
          <AdContainer 
            adSlot={adSlot}
            adClient={adClient}
            onLoad={() => setAdLoaded(true)}
            onError={() => setAdError(true)}
          />
        )}
      </div>
    </div>
  );
};
