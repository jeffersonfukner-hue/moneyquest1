import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ADSENSE_CONFIG } from '@/lib/adsenseConfig';

/**
 * Hook to load AdSense script ONLY on blog pages for non-authenticated users
 */
export const useBlogAdSense = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Only load on blog pages
  const isBlogPage = location.pathname === '/blog' || location.pathname.startsWith('/blog/');
  
  // Never load for authenticated users
  const isUserAuthenticated = !!user;
  
  // Can load if: on blog page AND not logged in AND AdSense configured
  const canLoad = isBlogPage && !isUserAuthenticated && !!ADSENSE_CONFIG.client;

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
