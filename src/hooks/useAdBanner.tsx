import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { ADSENSE_CONFIG } from '@/lib/adsenseConfig';

export const useAdBanner = () => {
  const { isPremium, loading } = useSubscription();
  const location = useLocation();
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Check if current route is restricted
  const isRestrictedRoute = ADSENSE_CONFIG.restrictedRoutes.some(
    route => location.pathname.startsWith(route)
  );

  // Show banner only for free users, not loading, not dismissed, not on restricted pages
  const shouldShowBanner = !loading && !isPremium && !dismissed && !isRestrictedRoute;
  
  // Use fallback if AdSense fails to load or not configured
  const showFallback = shouldShowBanner && (adError || !adLoaded);

  return {
    shouldShowBanner,
    showFallback,
    adLoaded,
    setAdLoaded,
    setAdError,
    dismiss: () => setDismissed(true),
  };
};
