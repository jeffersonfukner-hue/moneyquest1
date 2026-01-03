import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useTrialStatus } from '@/hooks/useTrialStatus';

export interface Campaign {
  id: string;
  name: string;
  campaign_type: 'seasonal' | 'promo' | 'discount' | 'feature';
  title: string;
  subtitle: string | null;
  cta_text: string;
  cta_link: string;
  icon: string;
  bg_gradient: string;
  text_color: string;
  priority: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  target_audience: 'all' | 'free' | 'premium' | 'trial';
}

export const useCampaigns = () => {
  const { isPremium, loading: subLoading } = useSubscription();
  const { isInTrial } = useTrialStatus();

  // Determine user audience type
  const getAudienceType = (): string => {
    if (isInTrial) return 'trial';
    if (isPremium) return 'premium';
    return 'free';
  };

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaigns', getAudienceType()],
    queryFn: async () => {
      const audience = getAudienceType();
      
      const { data, error } = await supabase
        .rpc('get_active_campaigns', { p_audience: audience });
      
      if (error) {
        console.error('Error fetching campaigns:', error);
        return [];
      }
      
      return (data || []) as Campaign[];
    },
    enabled: !subLoading,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Select a random campaign from active ones
  const getRandomCampaign = (): Campaign | null => {
    if (!campaigns || campaigns.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * campaigns.length);
    return campaigns[randomIndex];
  };

  return {
    campaigns: campaigns || [],
    isLoading: isLoading || subLoading,
    getRandomCampaign,
    hasCampaigns: (campaigns?.length || 0) > 0,
  };
};
