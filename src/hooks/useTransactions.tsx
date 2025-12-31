import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
  calculateFinancialMood,
  getBadgeKey
} from '@/lib/gameLogic';
import { getTodayString } from '@/lib/dateUtils';
import { toast } from '@/hooks/use-toast';
import { useSound } from '@/contexts/SoundContext';
import { useNarrativeEngine } from './useNarrativeEngine';
import { useBudgetAlerts } from './useBudgetAlerts';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useWallets } from './useWallets';

import { Quest, Badge } from '@/types/database';

interface NarrativeData {
  narrative: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  eventType: 'INCOME' | 'EXPENSE';
  category: string;
  amount?: number;
  currency?: string;
}

export const useTransactions = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { profile, refetch: refetchProfile } = useProfile();
  const { playSound } = useSound();
  const { generateNarrative } = useNarrativeEngine();
  const { checkBudgetAlert, showBudgetAlert } = useBudgetAlerts();
  const { convertCurrency, currency: userCurrency } = useCurrency();
  const { updateWalletBalance, recalculateBalance } = useWallets();
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
    transaction: Omit<Transaction, 'id' | 'user_id' | 'xp_earned' | 'created_at' | 'currency'> & { currency: string; wallet_id: string }
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

    // Update wallet balance
    if (transaction.wallet_id) {
      await updateWalletBalance(transaction.wallet_id, transaction.amount, transaction.type);
    }

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

    // Record XP change in history
    await supabase.from('xp_history').insert({
      user_id: user.id,
      xp_before: profile.xp,
      xp_after: newXP,
      xp_change: xpEarned,
      source: 'transaction',
      description: `${transaction.type}: ${transaction.description}`
    });

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
      const badgeKey = getBadgeKey(badge.name);
      const translatedName = t(`badges.items.${badgeKey}.name`, { defaultValue: badge.name });
      toast({
        title: `${badge.icon} ${t('celebration.badgeUnlocked')}`,
        description: translatedName,
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
            currency: transaction.currency,
          });
        }
      })
      .catch(console.error);

    return { error: null, xpEarned };
  };

  const updateTransaction = async (
    id: string,
    updates: Partial<Omit<Transaction, 'id' | 'user_id' | 'xp_earned' | 'created_at'>>
  ) => {
    if (!user || !profile) return { error: new Error('Not authenticated') };

    // Find original transaction
    const originalTx = transactions.find(t => t.id === id);
    if (!originalTx) return { error: new Error('Transaction not found') };

    // Prepare update data
    const updateData: Record<string, unknown> = {};
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.amount !== undefined) updateData.amount = updates.amount;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.date !== undefined) updateData.date = updates.date;
    if (updates.currency !== undefined) updateData.currency = updates.currency;

    // Update the transaction in DB
    const { error: txError } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', id);

    if (txError) return { error: txError };

    // Calculate profile adjustments
    const oldAmount = originalTx.amount;
    const newAmount = updates.amount ?? originalTx.amount;
    const oldType = originalTx.type;
    const newType = updates.type ?? originalTx.type;
    const oldCurrency = (originalTx.currency || 'BRL') as SupportedCurrency;
    const newCurrency = ((updates.currency ?? originalTx.currency) || 'BRL') as SupportedCurrency;
    const profileCurrency = (profile.currency || 'BRL') as SupportedCurrency;

    // Convert to profile currency
    const oldConverted = oldCurrency !== profileCurrency 
      ? convertCurrency(oldAmount, oldCurrency, profileCurrency) 
      : oldAmount;
    const newConverted = newCurrency !== profileCurrency 
      ? convertCurrency(newAmount, newCurrency, profileCurrency) 
      : newAmount;

    // Calculate new totals
    let newTotalIncome = profile.total_income;
    let newTotalExpenses = profile.total_expenses;

    // Revert old values
    if (oldType === 'INCOME') {
      newTotalIncome -= oldConverted;
    } else {
      newTotalExpenses -= oldConverted;
    }

    // Apply new values
    if (newType === 'INCOME') {
      newTotalIncome += newConverted;
    } else {
      newTotalExpenses += newConverted;
    }

    // Update profile
    const newMood = calculateFinancialMood(newTotalIncome, newTotalExpenses);
    await supabase
      .from('profiles')
      .update({
        total_income: newTotalIncome,
        total_expenses: newTotalExpenses,
        financial_mood: newMood
      })
      .eq('id', user.id);

    // Handle wallet balance changes
    const oldWalletId = originalTx.wallet_id;
    const newWalletId = updates.wallet_id ?? originalTx.wallet_id;

    // Recalculate balances for affected wallets
    if (oldWalletId) {
      await recalculateBalance(oldWalletId);
    }
    if (newWalletId && newWalletId !== oldWalletId) {
      await recalculateBalance(newWalletId);
    }

    toast({
      title: t('transactions.updated'),
      description: updates.description ?? originalTx.description,
    });

    await fetchTransactions();
    await refetchProfile();

    return { error: null };
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    // Find the transaction to get wallet_id before deleting
    const txToDelete = transactions.find(t => t.id === id);

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (!error) {
      // Recalculate wallet balance if transaction had a wallet
      if (txToDelete?.wallet_id) {
        await recalculateBalance(txToDelete.wallet_id);
      }
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
    updateTransaction,
    deleteTransaction, 
    refetch: fetchTransactions,
    celebrationData,
    clearCelebration,
    narrativeData,
    clearNarrative
  };
};
