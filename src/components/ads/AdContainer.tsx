import { useEffect, useRef } from 'react';

interface AdContainerProps {
  adSlot?: string;
  adClient?: string;
  onLoad?: () => void;
  onError?: () => void;
}

declare global {
  interface Window {
    adsbygoogle?: object[];
  }
}

export const AdContainer = ({ adSlot, adClient, onLoad, onError }: AdContainerProps) => {
  const adRef = useRef<HTMLModElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    // Only initialize once
    if (initialized.current) return;
    initialized.current = true;

    // Check if AdSense is configured
    if (!adSlot || !adClient) {
      // No AdSense configured, trigger fallback
      onError?.();
      return;
    }

    // Try to initialize AdSense
    try {
      if (window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        onLoad?.();
      } else {
        // AdSense script not loaded
        onError?.();
      }
    } catch (e) {
      console.warn('AdSense initialization failed:', e);
      onError?.();
    }
  }, [adSlot, adClient, onLoad, onError]);

  // If no ad config, return null (will use fallback)
  if (!adSlot || !adClient) {
    return null;
  }

  return (
    <ins
      ref={adRef}
      className="adsbygoogle"
      style={{ display: 'block', width: '100%', height: '50px' }}
      data-ad-client={adClient}
      data-ad-slot={adSlot}
      data-ad-format="horizontal"
      data-full-width-responsive="true"
    />
  );
};
