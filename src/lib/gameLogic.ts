import { supabase } from '@/integrations/supabase/client';
import { Profile, Transaction, Quest, Badge } from '@/types/database';

export const XP_PER_LEVEL = 1000;

export const calculateXP = (amount: number, type: 'INCOME' | 'EXPENSE'): number => {
  if (type === 'INCOME') {
    return Math.min(Math.floor(amount / 10), 100);
  }
  return Math.min(Math.floor(amount / 20), 50);
};

export const getLevelFromXP = (xp: number): number => {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
};

export const getXPProgress = (xp: number): number => {
  return (xp % XP_PER_LEVEL) / XP_PER_LEVEL * 100;
};

export const getLevelTitle = (level: number): string => {
  if (level <= 2) return 'Novice Saver';
  if (level <= 5) return 'Budget Apprentice';
  if (level <= 10) return 'Money Manager';
  if (level <= 20) return 'Finance Wizard';
  if (level <= 35) return 'Wealth Warrior';
  if (level <= 50) return 'Economy Expert';
  return 'Legendary Investor';
};

export const calculateStreak = (lastActiveDate: string | null): { newStreak: number; isNewDay: boolean } => {
  const today = new Date().toISOString().split('T')[0];
  
  if (!lastActiveDate) {
    return { newStreak: 1, isNewDay: true };
  }
  
  const lastDate = new Date(lastActiveDate);
  const todayDate = new Date(today);
  const diffTime = todayDate.getTime() - lastDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return { newStreak: -1, isNewDay: false }; // Same day, no change
  } else if (diffDays === 1) {
    return { newStreak: 1, isNewDay: true }; // Consecutive day, increment
  } else {
    return { newStreak: 1, isNewDay: true }; // Streak broken, reset
  }
};

export const checkAndUpdateBadges = async (
  userId: string, 
  profile: Profile,
  transactionCount: number
): Promise<Badge[]> => {
  const { data: badges } = await supabase
    .from('badges')
    .select('*')
    .eq('user_id', userId)
    .eq('is_unlocked', false);

  if (!badges) return [];

  const newlyUnlocked: Badge[] = [];
  const totalSaved = profile.total_income - profile.total_expenses;

  for (const badge of badges) {
    let shouldUnlock = false;

    switch (badge.requirement_type) {
      case 'XP':
        shouldUnlock = profile.xp >= badge.requirement_value;
        break;
      case 'STREAK':
        shouldUnlock = profile.streak >= badge.requirement_value;
        break;
      case 'TOTAL_SAVED':
        shouldUnlock = totalSaved >= badge.requirement_value;
        break;
      case 'COUNT':
        shouldUnlock = transactionCount >= badge.requirement_value;
        break;
    }

    if (shouldUnlock) {
      await supabase
        .from('badges')
        .update({ 
          is_unlocked: true, 
          unlocked_at: new Date().toISOString() 
        })
        .eq('id', badge.id);

      newlyUnlocked.push({ 
        ...badge, 
        is_unlocked: true,
        requirement_type: badge.requirement_type as Badge['requirement_type']
      });
    }
  }

  return newlyUnlocked;
};

export const checkAndUpdateQuests = async (
  userId: string,
  profile: Profile,
  transactionCount: number
): Promise<Quest[]> => {
  const { data: quests } = await supabase
    .from('quests')
    .select('*')
    .eq('user_id', userId)
    .eq('is_completed', false);

  if (!quests) return [];

  const completedQuests: Quest[] = [];
  const today = new Date().toISOString().split('T')[0];
  const totalSaved = profile.total_income - profile.total_expenses;

  for (const quest of quests) {
    let shouldComplete = false;

    // Check quest completion based on title
    if (quest.title === 'First Steps' && transactionCount >= 1) {
      shouldComplete = true;
    } else if (quest.title === 'Daily Logger' && quest.type === 'DAILY') {
      shouldComplete = true;
    } else if (quest.title === 'Week Warrior' && profile.streak >= 7) {
      shouldComplete = true;
    } else if (quest.title === 'Saver Supreme' && totalSaved >= 1000) {
      shouldComplete = true;
    }

    if (shouldComplete) {
      await supabase
        .from('quests')
        .update({ 
          is_completed: true, 
          completed_at: today 
        })
        .eq('id', quest.id);

      // Add XP reward to profile
      await supabase
        .from('profiles')
        .update({ xp: profile.xp + quest.xp_reward })
        .eq('id', userId);

      completedQuests.push({ 
        ...quest, 
        is_completed: true,
        type: quest.type as Quest['type']
      });
    }
  }

  return completedQuests;
};

export const CATEGORIES = {
  INCOME: ['Salary', 'Freelance', 'Investment', 'Gift', 'Refund', 'Other'],
  EXPENSE: ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Health', 'Education', 'Other']
};

export const AVATAR_ICONS = ['🎮', '🚀', '💰', '⚡', '🌟', '🔥', '💎', '🏆', '👑', '🎯'];
