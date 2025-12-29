import { supabase } from '@/integrations/supabase/client';
import { Profile, Transaction, Quest, Badge, QuestType, FinancialMood } from '@/types/database';

export const XP_PER_LEVEL = 1000;

// Calculate financial mood based on balance
export const calculateFinancialMood = (totalIncome: number, totalExpenses: number): FinancialMood => {
  const balance = totalIncome - totalExpenses;
  
  if (balance > 5000) return 'VERY_POSITIVE';
  if (balance >= 1000) return 'POSITIVE';
  if (balance >= 0) return 'NEUTRAL';
  if (balance >= -999) return 'NEGATIVE';
  return 'CRITICAL';
};

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

// Calculate quest progress based on quest key and transaction data
export const calculateQuestProgress = async (
  userId: string,
  questKey: string,
  questType: QuestType
): Promise<number> => {
  const today = new Date().toISOString().split('T')[0];
  const weekStart = getWeekStart();
  const monthStart = getMonthStart();

  switch (questKey) {
    case 'daily_checkin':
    case 'daily_expense':
    case 'daily_categorized': {
      const { count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('date', today);
      return count || 0;
    }

    case 'weekly_balance': {
      const { data } = await supabase
        .from('transactions')
        .select('date')
        .eq('user_id', userId)
        .gte('date', weekStart)
        .lte('date', today);
      
      if (!data) return 0;
      const uniqueDays = new Set(data.map(t => t.date));
      return uniqueDays.size;
    }

    case 'weekly_categories': {
      const { data } = await supabase
        .from('transactions')
        .select('category')
        .eq('user_id', userId)
        .eq('type', 'EXPENSE')
        .gte('date', weekStart)
        .lte('date', today);
      
      if (!data) return 0;
      const uniqueCategories = new Set(data.map(t => t.category));
      return uniqueCategories.size;
    }

    case 'monthly_discipline': {
      const { data } = await supabase
        .from('transactions')
        .select('date')
        .eq('user_id', userId)
        .gte('date', monthStart)
        .lte('date', today);
      
      if (!data) return 0;
      const weeksWithTransactions = new Set(
        data.map(t => getWeekNumber(new Date(t.date)))
      );
      return weeksWithTransactions.size;
    }

    case 'monthly_savings': {
      // Check if expenses are below goal
      const { data: goals } = await supabase
        .from('category_goals')
        .select('budget_limit')
        .eq('user_id', userId);
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_expenses')
        .eq('id', userId)
        .single();
      
      if (!goals || goals.length === 0 || !profile) return 0;
      
      const totalBudget = goals.reduce((sum, g) => sum + Number(g.budget_limit), 0);
      return profile.total_expenses <= totalBudget ? 1 : 0;
    }

    default:
      return 0;
  }
};

// Check and update quests with new progress system
export const checkAndUpdateQuests = async (
  userId: string,
  profile: Profile,
  transactionCount: number
): Promise<Quest[]> => {
  // First, reset any expired quests
  await supabase.rpc('reset_expired_quests', { p_user_id: userId });

  const { data: quests } = await supabase
    .from('quests')
    .select('*')
    .eq('user_id', userId)
    .eq('is_completed', false)
    .eq('is_active', true);

  if (!quests) return [];

  const completedQuests: Quest[] = [];
  const today = new Date().toISOString().split('T')[0];
  const totalSaved = profile.total_income - profile.total_expenses;

  for (const quest of quests) {
    let shouldComplete = false;
    let newProgress = quest.progress_current;

    // Handle different quest types
    if (quest.quest_key) {
      newProgress = await calculateQuestProgress(userId, quest.quest_key, quest.type as QuestType);
      shouldComplete = newProgress >= quest.progress_target;

      // Update progress
      if (newProgress !== quest.progress_current) {
        await supabase
          .from('quests')
          .update({ progress_current: newProgress })
          .eq('id', quest.id);
      }
    } else {
      // Legacy quest handling
      if (quest.title === 'First Steps' && transactionCount >= 1) {
        shouldComplete = true;
      } else if (quest.title === 'Week Warrior' && profile.streak >= 7) {
        shouldComplete = true;
      } else if (quest.title === 'Saver Supreme' && totalSaved >= 1000) {
        shouldComplete = true;
      }
    }

    if (shouldComplete) {
      await supabase
        .from('quests')
        .update({ 
          is_completed: true, 
          completed_at: today,
          progress_current: quest.progress_target
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
        progress_current: quest.progress_target,
        type: quest.type as QuestType
      });

      // Check if this is a special quest with badge reward
      if (quest.type === 'SPECIAL' && quest.season) {
        const badgeName = getSeasonalBadgeName(quest.season);
        if (badgeName) {
          await supabase
            .from('badges')
            .update({ 
              is_unlocked: true, 
              unlocked_at: new Date().toISOString() 
            })
            .eq('user_id', userId)
            .eq('name', badgeName);
        }
      }
    }
  }

  return completedQuests;
};

// Helper functions
export const getWeekStart = (): string => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const weekStart = new Date(now.setDate(diff));
  return weekStart.toISOString().split('T')[0];
};

export const getMonthStart = (): string => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
};

export const getWeekNumber = (date: Date): number => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

export const getSeasonalBadgeName = (season: string): string | null => {
  const badgeMap: Record<string, string> = {
    'halloween': 'Pumpkin Saver',
    'christmas': 'Christmas Planner',
    'carnival': 'Smart Reveler',
    'easter': 'Golden Egg'
  };
  return badgeMap[season.toLowerCase()] || null;
};

// Get time remaining until quest resets
export const getTimeUntilReset = (periodEndDate: string | null, questType: QuestType): { 
  hours: number; 
  minutes: number; 
  days: number;
  displayText: string;
} => {
  if (!periodEndDate) {
    return { hours: 0, minutes: 0, days: 0, displayText: 'N/A' };
  }

  const now = new Date();
  const endDate = new Date(periodEndDate + 'T23:59:59');
  const diff = endDate.getTime() - now.getTime();

  if (diff <= 0) {
    return { hours: 0, minutes: 0, days: 0, displayText: 'Resetting...' };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  let displayText = '';
  if (days > 0) {
    displayText = `${days}d ${hours}h`;
  } else if (hours > 0) {
    displayText = `${hours}h ${minutes}m`;
  } else {
    displayText = `${minutes}m`;
  }

  return { hours, minutes, days, displayText };
};

export const CATEGORIES = {
  INCOME: ['Salary', 'Freelance', 'Investment', 'Gift', 'Refund', 'Other'],
  EXPENSE: ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Health', 'Education', 'Other']
};

export const AVATAR_ICONS = ['🎮', '🚀', '💰', '⚡', '🌟', '🔥', '💎', '🏆', '👑', '🎯'];

export const QUEST_TYPE_CONFIG: Record<QuestType, { 
  icon: string; 
  label: string; 
  color: string;
  bgColor: string;
}> = {
  DAILY: { 
    icon: '🌅', 
    label: 'Daily', 
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10'
  },
  WEEKLY: { 
    icon: '📅', 
    label: 'Weekly', 
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10'
  },
  MONTHLY: { 
    icon: '📆', 
    label: 'Monthly', 
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10'
  },
  SPECIAL: { 
    icon: '✨', 
    label: 'Special', 
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10'
  },
  ACHIEVEMENT: { 
    icon: '🏆', 
    label: 'Achievement', 
    color: 'text-primary',
    bgColor: 'bg-primary/10'
  }
};