import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface DailyRewardStatus {
  can_claim: boolean;
  current_streak: number;
  potential_streak: number;
  multiplier: number;
  last_claim: string | null;
  total_claims: number;
}

export interface ClaimResult {
  success: boolean;
  claimed?: boolean;
  already_claimed?: boolean;
  streak_day?: number;
  streak_broken?: boolean;
  base_xp?: number;
  bonus_xp?: number;
  total_xp?: number;
  multiplier?: number;
  next_multiplier?: number;
  message?: string;
}

export const useDailyReward = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<DailyRewardStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!user) {
      setStatus(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('get_daily_reward_status', {
        p_user_id: user.id
      });

      if (!error && data) {
        setStatus(data as unknown as DailyRewardStatus);
      }
    } catch (err) {
      console.error('Error fetching daily reward status:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const claimReward = async (): Promise<ClaimResult | null> => {
    if (!user) return null;

    setClaiming(true);
    try {
      const { data, error } = await supabase.rpc('claim_daily_reward', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error claiming reward:', error);
        return null;
      }

      // Refresh status after claiming
      await fetchStatus();
      
      return data as unknown as ClaimResult;
    } catch (err) {
      console.error('Error claiming reward:', err);
      return null;
    } finally {
      setClaiming(false);
    }
  };

  // Get multiplier display text
  const getMultiplierText = (multiplier: number): string => {
    return `${multiplier}x`;
  };

  // Get streak milestone info
  const getStreakMilestone = (streak: number): { next: number; reward: string } | null => {
    const milestones = [
      { day: 3, reward: '1.5x XP' },
      { day: 5, reward: '2x XP' },
      { day: 7, reward: '2.5x XP + Badge' }
    ];
    
    for (const milestone of milestones) {
      if (streak < milestone.day) {
        return { next: milestone.day, reward: milestone.reward };
      }
    }
    return null;
  };

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    status,
    loading,
    claiming,
    claimReward,
    refetch: fetchStatus,
    getMultiplierText,
    getStreakMilestone
  };
};
