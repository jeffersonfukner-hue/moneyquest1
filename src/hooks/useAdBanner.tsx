import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { ADSENSE_CONFIG } from '@/lib/adsenseConfig';

export const useAdBanner = () => {
  const { isPremium, loading } = useSubscription();
  const location = useLocation();
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  // Check if current route is restricted
  const isRestrictedRoute = ADSENSE_CONFIG.restrictedRoutes.some(
    route => location.pathname.startsWith(route)
  );

  // Show banner only for free users, not loading, not on restricted pages
  // Banner cannot be permanently dismissed for free users
  const shouldShowBanner = !loading && !isPremium && !isRestrictedRoute;
  
  // Use fallback if AdSense fails to load or not configured
  const showFallback = shouldShowBanner && (adError || !adLoaded);

  return {
    shouldShowBanner,
    showFallback,
    adLoaded,
    setAdLoaded,
    setAdError,
  };
};
