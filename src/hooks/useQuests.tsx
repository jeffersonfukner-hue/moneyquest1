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
      // Deduplicate quests by quest_key - keep the most relevant one
      const questMap = new Map<string, Quest>();
      
      const rawQuests = data.map(q => ({
        ...q,
        type: q.type as QuestType,
        period_start_date: q.period_start_date || null,
        period_end_date: q.period_end_date || null,
        progress_current: q.progress_current || 0,
        progress_target: q.progress_target || 1,
        quest_key: q.quest_key || null,
        is_active: q.is_active ?? true,
        season: q.season || null
      }));

      for (const quest of rawQuests) {
        // Normalize quest_key - remove UUID suffixes for deduplication
        const baseKey = quest.quest_key 
          ? quest.quest_key.replace(/_[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i, '')
          : `${quest.type}_${quest.title}`;
        
        const existing = questMap.get(baseKey);
        
        if (!existing) {
          questMap.set(baseKey, quest);
        } else {
          // Keep the one with more progress, or completed, or most recent dates
          const shouldReplace = 
            (!existing.is_completed && quest.is_completed) ||
            (quest.progress_current > existing.progress_current) ||
            (quest.period_end_date && !existing.period_end_date);
          
          if (shouldReplace) {
            questMap.set(baseKey, quest);
          }
        }
      }

      setQuests(Array.from(questMap.values()));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchQuests();
  }, [fetchQuests]);

  // Filter quests by type - separate missions from achievements
  const getQuestsByType = useCallback((type: QuestType): Quest[] => {
    return quests.filter(q => q.type === type);
  }, [quests]);

  // Get only mission quests (DAILY, WEEKLY, MONTHLY, SPECIAL)
  const getMissions = useCallback((): Quest[] => {
    return quests.filter(q => ['DAILY', 'WEEKLY', 'MONTHLY', 'SPECIAL'].includes(q.type));
  }, [quests]);

  // Get only achievement quests
  const getAchievements = useCallback((): Quest[] => {
    return quests.filter(q => q.type === 'ACHIEVEMENT');
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
    getMissions,
    getAchievements,
    getQuestStats
  };
};