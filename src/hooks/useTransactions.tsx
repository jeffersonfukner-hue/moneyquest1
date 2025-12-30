import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Transaction, SupportedCurrency } from '@/types/database';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';
import { 
  calculateXP, 
  getLevelFromXP, 
  getLevelTitle, 
  calculateStreak,
  checkAndUpdateBadges,
  checkAndUpdateQuests,
  calculateFinancialMood
} from '@/lib/gameLogic';
import { getTodayString } from '@/lib/dateUtils';
import { toast } from '@/hooks/use-toast';
import { useSound } from '@/contexts/SoundContext';
import { useNarrativeEngine } from './useNarrativeEngine';
import { useBudgetAlerts } from './useBudgetAlerts';
import { useCurrency } from '@/contexts/CurrencyContext';

import { Quest, Badge } from '@/types/database';

interface NarrativeData {
  narrative: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  eventType: 'INCOME' | 'EXPENSE';
  category: string;
  amount?: number;
}

export const useTransactions = () => {
  const { user } = useAuth();
  const { profile, refetch: refetchProfile } = useProfile();
  const { playSound } = useSound();
  const { generateNarrative } = useNarrativeEngine();
  const { checkBudgetAlert, showBudgetAlert } = useBudgetAlerts();
  const { convertCurrency, currency: userCurrency } = useCurrency();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [celebrationData, setCelebrationData] = useState<{
    quest: Quest | null;
    badge: Badge | null;
    levelUp: boolean;
  } | null>(null);
  const [narrativeData, setNarrativeData] = useState<NarrativeData | null>(null);

  const fetchTransactions = async () => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTransactions(data.map(t => ({
        ...t,
        type: t.type as Transaction['type'],
        currency: (t.currency || 'BRL') as Transaction['currency']
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  const addTransaction = async (
    transaction: Omit<Transaction, 'id' | 'user_id' | 'xp_earned' | 'created_at' | 'currency'> & { currency: string }
  ) => {
    if (!user || !profile) return { error: new Error('Not authenticated') };

    const xpEarned = calculateXP(transaction.amount, transaction.type);
    
    // Insert transaction
    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        ...transaction,
        xp_earned: xpEarned,
      });

    if (txError) return { error: txError };

    // Calculate new profile values
    const newXP = profile.xp + xpEarned;
    const newLevel = getLevelFromXP(newXP);
    const newLevelTitle = getLevelTitle(newLevel);
    const { newStreak, isNewDay } = calculateStreak(profile.last_active_date);
    const today = getTodayString();

    const profileUpdates: Record<string, unknown> = {
      xp: newXP,
      level: newLevel,
      level_title: newLevelTitle,
    };

    if (isNewDay) {
      profileUpdates.streak = newStreak === -1 ? profile.streak : 
        (newStreak === 1 && profile.last_active_date && 
         new Date(today + 'T00:00:00').getTime() - new Date(profile.last_active_date + 'T00:00:00').getTime() === 86400000)
          ? profile.streak + 1 
          : newStreak;
      profileUpdates.last_active_date = today;
    }

    // Convert transaction amount to profile's currency for consistent totals
    const txCurrency = transaction.currency as SupportedCurrency;
    const profileCurrency = (profile.currency || 'BRL') as SupportedCurrency;
    const convertedAmount = txCurrency !== profileCurrency 
      ? convertCurrency(transaction.amount, txCurrency, profileCurrency)
      : transaction.amount;

    if (transaction.type === 'INCOME') {
      profileUpdates.total_income = profile.total_income + convertedAmount;
    } else {
      profileUpdates.total_expenses = profile.total_expenses + convertedAmount;
    }

    // Calculate new financial mood
    const newTotalIncome = profileUpdates.total_income as number ?? profile.total_income;
    const newTotalExpenses = profileUpdates.total_expenses as number ?? profile.total_expenses;
    profileUpdates.financial_mood = calculateFinancialMood(newTotalIncome, newTotalExpenses);

    // Update profile
    await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', user.id);

    // Check for level up
    const didLevelUp = newLevel > profile.level;
    if (didLevelUp) {
      playSound('levelUp');
      toast({
        title: "🎉 Level Up!",
        description: `You're now Level ${newLevel} - ${newLevelTitle}!`,
      });
    }

    // Play XP sound and show toast
    playSound('xpGain');
    toast({
      title: `+${xpEarned} XP`,
      description: `Earned from logging ${transaction.type.toLowerCase()}`,
    });

    // Check quests and badges
    const transactionCount = transactions.length + 1;
    const updatedProfile = { ...profile, ...profileUpdates } as typeof profile;
    
    const completedQuests = await checkAndUpdateQuests(user.id, updatedProfile, transactionCount);
    const unlockedBadges = await checkAndUpdateBadges(user.id, updatedProfile, transactionCount);

    // Trigger celebration for first completed quest and first unlocked badge
    if (completedQuests.length > 0 || unlockedBadges.length > 0 || didLevelUp) {
      // Play sounds for completions
      if (completedQuests.length > 0) {
        playSound('questComplete');
      }
      if (unlockedBadges.length > 0) {
        setTimeout(() => playSound('badgeUnlock'), 300);
      }
      
      setCelebrationData({
        quest: completedQuests[0] || null,
        badge: unlockedBadges[0] || null,
        levelUp: didLevelUp
      });
    }

    // Still show toasts for any additional completions
    completedQuests.slice(1).forEach(quest => {
      toast({
        title: "🎯 Quest Complete!",
        description: `${quest.title} - +${quest.xp_reward} XP`,
      });
    });

    unlockedBadges.slice(1).forEach(badge => {
      toast({
        title: `${badge.icon} Badge Unlocked!`,
        description: badge.name,
      });
    });

    await fetchTransactions();
    await refetchProfile();

    // Check budget alerts for expense transactions (non-blocking)
    if (transaction.type === 'EXPENSE') {
      checkBudgetAlert(user.id, transaction.category, transaction.amount)
        .then((alert) => {
          if (alert) {
            showBudgetAlert(alert);
          }
        })
        .catch(console.error);
    }

    // Generate narrative in background (non-blocking) and save to journal
    generateNarrative(transaction.amount, transaction.category, transaction.type)
      .then(async (result) => {
        if (result) {
          // Re-fetch to get the new transaction ID
          const { data: latestTx } = await supabase
            .from('transactions')
            .select('id')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Save narrative to journal
          if (latestTx) {
            await supabase.from('transaction_narratives').insert({
              user_id: user.id,
              transaction_id: latestTx.id,
              narrative: result.narrative,
              impact: result.impact,
              category: transaction.category,
              event_type: transaction.type,
              amount: transaction.amount,
            });
          }

          setNarrativeData({
            narrative: result.narrative,
            impact: result.impact,
            eventType: transaction.type,
            category: transaction.category,
            amount: transaction.amount,
          });
        }
      })
      .catch(console.error);

    return { error: null };
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (!error) {
      await fetchTransactions();
    }

    return { error };
  };

  const clearCelebration = () => setCelebrationData(null);
  const clearNarrative = () => setNarrativeData(null);

  return { 
    transactions, 
    loading, 
    addTransaction, 
    deleteTransaction, 
    refetch: fetchTransactions,
    celebrationData,
    clearCelebration,
    narrativeData,
    clearNarrative
  };
};
