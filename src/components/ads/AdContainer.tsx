import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { canShowGoogleAds } from '@/lib/routeConfig';

interface AdContainerProps {
  adSlot?: string;
  adClient?: string;
  onLoad?: () => void;
  onError?: () => void;
}

declare global {
  interface Window {
    adsbygoogle?: { push: (params: object) => void } | object[];
  }
}

export const AdContainer = ({ adSlot, adClient, onLoad, onError }: AdContainerProps) => {
  const adRef = useRef<HTMLModElement>(null);
  const initAttempted = useRef(false);
  const location = useLocation();
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [adStatus, setAdStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  // CRITICAL: Block Google Ads on restricted routes
  const canShowAds = canShowGoogleAds(location.pathname);

  // Reset on route change for SPA navigation
  useEffect(() => {
    initAttempted.current = false;
    setAdStatus('loading');
  }, [location.pathname]);

  // Block rendering on restricted routes
  if (!canShowAds) {
    onError?.();
    return null;
  }

  // Check if AdSense script is loaded with retry mechanism
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 30; // 3 seconds max wait

    const checkScript = () => {
      if (typeof window !== 'undefined' && window.adsbygoogle !== undefined) {
        setIsScriptLoaded(true);
        return;
      }
      
      retryCount++;
      if (retryCount < maxRetries) {
        setTimeout(checkScript, 100);
      } else {
        console.warn('AdSense: Script failed to load after timeout');
        setAdStatus('error');
        onError?.();
      }
    };
    
    checkScript();
  }, [onError]);

  // Initialize ad with proper error handling
  const initializeAd = useCallback(() => {
    if (initAttempted.current || !adRef.current) return;
    
    if (!adSlot || !adClient) {
      setAdStatus('error');
      onError?.();
      return;
    }

    try {
      // Check if the ad element already has content (already filled)
      const insElement = adRef.current;
      if (insElement && insElement.getAttribute('data-ad-status') === 'filled') {
        setAdStatus('loaded');
        onLoad?.();
        return;
      }

      (window.adsbygoogle = window.adsbygoogle || []).push({});
      initAttempted.current = true;
      
      // Monitor for ad fill status
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'data-ad-status') {
            const status = insElement?.getAttribute('data-ad-status');
            if (status === 'filled') {
              setAdStatus('loaded');
              onLoad?.();
              observer.disconnect();
            } else if (status === 'unfilled') {
              setAdStatus('error');
              onError?.();
              observer.disconnect();
            }
          }
        });
      });

      if (insElement) {
        observer.observe(insElement, { attributes: true });
        
        // Fallback timeout for observer
        setTimeout(() => {
          observer.disconnect();
          if (adStatus === 'loading') {
            // Assume loaded if no explicit error
            setAdStatus('loaded');
            onLoad?.();
          }
        }, 2000);
      }
    } catch (e) {
      console.warn('AdSense initialization failed:', e);
      setAdStatus('error');
      onError?.();
    }
  }, [adSlot, adClient, onLoad, onError, adStatus]);

  // Initialize when script is ready
  useEffect(() => {
    if (!isScriptLoaded || initAttempted.current) return;

    // Small delay to ensure DOM is fully ready
    const timer = setTimeout(initializeAd, 150);
    return () => clearTimeout(timer);
  }, [isScriptLoaded, initializeAd]);

  // If no ad config, trigger error immediately
  if (!adSlot || !adClient) {
    return null;
  }

  return (
    <ins
      ref={adRef}
      className="adsbygoogle"
      style={{ 
        display: 'block', 
        width: '100%', 
        height: '50px',
        minHeight: '50px',
        overflow: 'hidden'
      }}
      data-ad-client={adClient}
      data-ad-slot={adSlot}
      data-ad-format="horizontal"
      data-full-width-responsive="true"
    />
  );
};
