import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Transaction } from '@/types/database';
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
import { toast } from '@/hooks/use-toast';

export const useTransactions = () => {
  const { user } = useAuth();
  const { profile, refetch: refetchProfile } = useProfile();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

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
        type: t.type as Transaction['type']
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  const addTransaction = async (
    transaction: Omit<Transaction, 'id' | 'user_id' | 'xp_earned' | 'created_at'>
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
    const today = new Date().toISOString().split('T')[0];

    const profileUpdates: Record<string, unknown> = {
      xp: newXP,
      level: newLevel,
      level_title: newLevelTitle,
    };

    if (isNewDay) {
      profileUpdates.streak = newStreak === -1 ? profile.streak : 
        (newStreak === 1 && profile.last_active_date && 
         new Date(today).getTime() - new Date(profile.last_active_date).getTime() === 86400000)
          ? profile.streak + 1 
          : newStreak;
      profileUpdates.last_active_date = today;
    }

    if (transaction.type === 'INCOME') {
      profileUpdates.total_income = profile.total_income + transaction.amount;
    } else {
      profileUpdates.total_expenses = profile.total_expenses + transaction.amount;
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
    if (newLevel > profile.level) {
      toast({
        title: "🎉 Level Up!",
        description: `You're now Level ${newLevel} - ${newLevelTitle}!`,
      });
    }

    // Show XP earned
    toast({
      title: `+${xpEarned} XP`,
      description: `Earned from logging ${transaction.type.toLowerCase()}`,
    });

    // Check quests and badges
    const transactionCount = transactions.length + 1;
    const updatedProfile = { ...profile, ...profileUpdates } as typeof profile;
    
    const completedQuests = await checkAndUpdateQuests(user.id, updatedProfile, transactionCount);
    const unlockedBadges = await checkAndUpdateBadges(user.id, updatedProfile, transactionCount);

    completedQuests.forEach(quest => {
      toast({
        title: "🎯 Quest Complete!",
        description: `${quest.title} - +${quest.xp_reward} XP`,
      });
    });

    unlockedBadges.forEach(badge => {
      toast({
        title: `${badge.icon} Badge Unlocked!`,
        description: badge.name,
      });
    });

    await fetchTransactions();
    await refetchProfile();

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

  return { transactions, loading, addTransaction, deleteTransaction, refetch: fetchTransactions };
};
