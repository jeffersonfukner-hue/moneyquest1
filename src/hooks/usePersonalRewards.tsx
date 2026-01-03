import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface PersonalReward {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  xp_threshold: number;
  icon: string;
  is_claimed: boolean;
  claimed_at: string | null;
  created_at: string;
}

const DEFAULT_REWARD_SUGGESTIONS = [
  { name: 'Café especial', xp: 500, icon: '☕', description: 'Um café premium na sua cafeteria favorita' },
  { name: 'Livro novo', xp: 1000, icon: '📚', description: 'Comprar aquele livro que você quer' },
  { name: 'Jantar especial', xp: 2500, icon: '🍽️', description: 'Um jantar especial para comemorar' },
  { name: 'Dia de folga', xp: 5000, icon: '🏖️', description: 'Um dia inteiro para relaxar' },
  { name: 'Presente para si', xp: 10000, icon: '🎁', description: 'Algo especial que você merece' },
];

export const usePersonalRewards = () => {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<PersonalReward[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRewards = useCallback(async () => {
    if (!user) {
      setRewards([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('personal_rewards')
      .select('*')
      .eq('user_id', user.id)
      .order('xp_threshold', { ascending: true });

    if (!error && data) {
      setRewards(data as PersonalReward[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  const addReward = async (reward: {
    name: string;
    description?: string;
    xp_threshold: number;
    icon: string;
  }) => {
    if (!user) return { error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('personal_rewards')
      .insert({
        user_id: user.id,
        name: reward.name,
        description: reward.description || null,
        xp_threshold: reward.xp_threshold,
        icon: reward.icon,
      })
      .select()
      .single();

    if (!error && data) {
      setRewards(prev => [...prev, data as PersonalReward].sort((a, b) => a.xp_threshold - b.xp_threshold));
    }

    return { data, error };
  };

  const claimReward = async (rewardId: string) => {
    if (!user) return { error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('personal_rewards')
      .update({
        is_claimed: true,
        claimed_at: new Date().toISOString(),
      })
      .eq('id', rewardId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (!error && data) {
      setRewards(prev =>
        prev.map(r => (r.id === rewardId ? (data as PersonalReward) : r))
      );
    }

    return { data, error };
  };

  const deleteReward = async (rewardId: string) => {
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('personal_rewards')
      .delete()
      .eq('id', rewardId)
      .eq('user_id', user.id);

    if (!error) {
      setRewards(prev => prev.filter(r => r.id !== rewardId));
    }

    return { error };
  };

  const getNextReward = (currentXP: number): PersonalReward | null => {
    return rewards.find(r => !r.is_claimed && r.xp_threshold > currentXP) || null;
  };

  const getClaimableRewards = (currentXP: number): PersonalReward[] => {
    return rewards.filter(r => !r.is_claimed && r.xp_threshold <= currentXP);
  };

  return {
    rewards,
    loading,
    refetch: fetchRewards,
    addReward,
    claimReward,
    deleteReward,
    getNextReward,
    getClaimableRewards,
    suggestions: DEFAULT_REWARD_SUGGESTIONS,
  };
};
