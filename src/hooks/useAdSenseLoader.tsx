import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { canShowGoogleAds } from '@/lib/routeConfig';
import { ADSENSE_CONFIG } from '@/lib/adsenseConfig';

const ADSENSE_SCRIPT_ID = 'adsense-script';

/**
 * Hook to dynamically load Google AdSense script only on public pages
 * This prevents AdSense from loading in authenticated/restricted areas
 */
export const useAdSenseLoader = () => {
  const location = useLocation();
  const canLoad = canShowGoogleAds(location.pathname);

  useEffect(() => {
    // Don't load on restricted pages
    if (!canLoad) {
      return;
    }

    // Check if already loaded
    if (document.getElementById(ADSENSE_SCRIPT_ID)) {
      return;
    }

    // Check if AdSense client is configured
    if (!ADSENSE_CONFIG.client) {
      return;
    }

    // Load AdSense script with requestIdleCallback to avoid blocking LCP
    const loadScript = () => {
      if (document.getElementById(ADSENSE_SCRIPT_ID)) return;
      
      const script = document.createElement('script');
      script.id = ADSENSE_SCRIPT_ID;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CONFIG.client}`;
      script.async = true;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    };

    // Use requestIdleCallback for non-blocking load, with fallback
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(loadScript, { timeout: 3000 });
    } else {
      setTimeout(loadScript, 2000);
    }

    // Note: We intentionally do NOT remove the script on cleanup
    // because it would cause issues with ad initialization
  }, [canLoad, location.pathname]);

  return { canLoad };
};
