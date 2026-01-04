import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ADSENSE_CONFIG } from '@/lib/adsenseConfig';

/**
 * Hook to load AdSense script ONLY on blog pages
 * Shows ads for ALL users (visitors, free, and premium) on blog pages
 * This is editorial content, separate from the financial app
 */
export const useBlogAdSense = () => {
  const location = useLocation();
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Only load on blog pages - editorial content is always monetizable
  const isBlogPage = location.pathname === '/blog' || location.pathname.startsWith('/blog/');
  
  // Can load if: on blog page AND AdSense configured
  // Note: We show ads to ALL users on blog (visitors, free, premium)
  // Blog is editorial content, not part of the financial app
  const canLoad = isBlogPage && !!ADSENSE_CONFIG.client;

  useEffect(() => {
    if (!canLoad) {
      return;
    }

    // Check if script already exists
    const existingScript = document.querySelector(`script[src*="adsbygoogle.js"]`);
    if (existingScript) {
      setScriptLoaded(true);
      return;
    }

    // Create and inject the AdSense script
    const script = document.createElement('script');
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CONFIG.client}`;
    script.async = true;
    script.crossOrigin = 'anonymous';
    
    script.onload = () => {
      setScriptLoaded(true);
    };

    script.onerror = () => {
      console.error('useBlogAdSense: Failed to load AdSense script');
      setScriptLoaded(false);
    };

    document.head.appendChild(script);

    // Cleanup not needed - script should persist once loaded
  }, [canLoad]);

  return {
    scriptLoaded,
    isBlogPage,
    canShowAds: canLoad && scriptLoaded,
  };
};

export default useBlogAdSense;
