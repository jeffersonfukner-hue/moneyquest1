import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface ReferralStats {
  referral_code: string;
  referral_link: string;
  total_referrals: number;
  pending_referrals: number;
  completed_referrals: number;
  total_xp_earned: number;
  total_premium_days: number;
}

export const useReferral = () => {
  const { user } = useAuth();

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['referral-stats', user?.id],
    queryFn: async (): Promise<ReferralStats | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase.rpc('get_referral_stats', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error fetching referral stats:', error);
        return null;
      }

      return data as unknown as ReferralStats;
    },
    enabled: !!user?.id,
  });

  const processReferralCode = async (referralCode: string): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) return { success: false, error: 'not_authenticated' };

    const { data, error } = await supabase.rpc('process_referral_signup', {
      p_referred_user_id: user.id,
      p_referral_code: referralCode.toLowerCase()
    });

    if (error) {
      console.error('Error processing referral:', error);
      return { success: false, error: error.message };
    }

    const result = data as { success: boolean; error?: string };
    return result;
  };

  return {
    stats,
    isLoading,
    refetch,
    processReferralCode,
    referralCode: stats?.referral_code || user?.id?.substring(0, 8) || '',
    referralLink: stats?.referral_link || `https://moneyquest.app.br/${user?.id?.substring(0, 8) || ''}`,
  };
};
