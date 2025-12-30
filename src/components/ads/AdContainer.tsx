import { useEffect, useRef, useState } from 'react';

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
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  // Check if AdSense script is loaded
  useEffect(() => {
    const checkScript = () => {
      if (typeof window !== 'undefined' && window.adsbygoogle !== undefined) {
        setIsScriptLoaded(true);
      } else {
        // Retry after short delay (script may still be loading)
        setTimeout(checkScript, 100);
      }
    };
    checkScript();
  }, []);

  // Initialize ad only when script is loaded and element is mounted
  useEffect(() => {
    if (!isScriptLoaded || initialized.current) return;

    // Check if AdSense is configured
    if (!adSlot || !adClient) {
      onError?.();
      return;
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        initialized.current = true;
        onLoad?.();
      } catch (e) {
        console.warn('AdSense initialization failed:', e);
        onError?.();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isScriptLoaded, adSlot, adClient, onLoad, onError]);

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
