import { useState } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';

export const useAdBanner = () => {
  const { isPremium, loading } = useSubscription();
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Show banner only for free users, not loading, not dismissed
  const shouldShowBanner = !loading && !isPremium && !dismissed;
  
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
