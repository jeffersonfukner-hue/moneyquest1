import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Quest, QuestType } from '@/types/database';
import { useAuth } from './useAuth';

export const useQuests = () => {
  const { user } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuests = useCallback(async () => {
    if (!user) {
      setQuests([]);
      setLoading(false);
      return;
    }

    // First, reset any expired quests
    try {
      await supabase.rpc('reset_expired_quests', { p_user_id: user.id });
    } catch (error) {
      console.error('Error resetting expired quests:', error);
    }

    const { data, error } = await supabase
      .from('quests')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('is_completed', { ascending: true })
      .order('type', { ascending: true });

    if (!error && data) {
      setQuests(data.map(q => ({
        ...q,
        type: q.type as QuestType,
        period_start_date: q.period_start_date || null,
        period_end_date: q.period_end_date || null,
        progress_current: q.progress_current || 0,
        progress_target: q.progress_target || 1,
        quest_key: q.quest_key || null,
        is_active: q.is_active ?? true,
        season: q.season || null
      })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchQuests();
  }, [fetchQuests]);

  // Filter quests by type
  const getQuestsByType = useCallback((type: QuestType): Quest[] => {
    return quests.filter(q => q.type === type);
  }, [quests]);

  // Get quest completion stats
  const getQuestStats = useCallback(() => {
    const daily = quests.filter(q => q.type === 'DAILY');
    const weekly = quests.filter(q => q.type === 'WEEKLY');
    const monthly = quests.filter(q => q.type === 'MONTHLY');
    const special = quests.filter(q => q.type === 'SPECIAL');
    const achievement = quests.filter(q => q.type === 'ACHIEVEMENT');

    return {
      daily: {
        completed: daily.filter(q => q.is_completed).length,
        total: daily.length
      },
      weekly: {
        completed: weekly.filter(q => q.is_completed).length,
        total: weekly.length
      },
      monthly: {
        completed: monthly.filter(q => q.is_completed).length,
        total: monthly.length
      },
      special: {
        completed: special.filter(q => q.is_completed).length,
        total: special.length
      },
      achievement: {
        completed: achievement.filter(q => q.is_completed).length,
        total: achievement.length
      }
    };
  }, [quests]);

  return { 
    quests, 
    loading, 
    refetch: fetchQuests,
    getQuestsByType,
    getQuestStats
  };
};