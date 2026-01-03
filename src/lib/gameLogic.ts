import { supabase } from '@/integrations/supabase/client';
import { Profile, Transaction, Quest, Badge, QuestType, FinancialMood } from '@/types/database';
import { getTodayString, getWeekStartString, getMonthStartString, parseDateString, formatDateForDB } from './dateUtils';

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
    // Minimum 1 XP, maximum 100 XP for income
    return Math.max(1, Math.min(Math.floor(amount / 10), 100));
  }
  // Minimum 1 XP, maximum 50 XP for expense
  return Math.max(1, Math.min(Math.floor(amount / 20), 50));
};

export const getLevelFromXP = (xp: number): number => {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
};

export const getXPProgress = (xp: number): number => {
  return (xp % XP_PER_LEVEL) / XP_PER_LEVEL * 100;
};

// Returns the translation key for level title (use with i18n: t(`levels.${key}`))
export const getLevelTitleKey = (level: number): string => {
  if (level <= 2) return 'novice_saver';
  if (level <= 5) return 'budget_apprentice';
  if (level <= 10) return 'money_manager';
  if (level <= 20) return 'finance_wizard';
  if (level <= 35) return 'wealth_warrior';
  if (level <= 50) return 'economy_expert';
  return 'legendary_investor';
};

// Returns the translation key for badge name (use with i18n: t(`badges.items.${key}.name`))
export const getBadgeKey = (badgeName: string): string => {
  const nameToKey: Record<string, string> = {
    'First Steps': 'first_steps',
    'Getting Started': 'getting_started',
    'Rising Star': 'rising_star',
    'XP Champion': 'xp_champion',
    'Streak Starter': 'streak_starter',
    'Streak Master': 'streak_master',
    'Penny Pincher': 'penny_pincher',
    'Savings Pro': 'savings_pro',
    'Pumpkin Saver': 'pumpkin_saver',
    'Christmas Planner': 'christmas_planner',
    'Smart Reveler': 'smart_reveler',
    'Golden Egg': 'golden_egg',
  };
  return nameToKey[badgeName] || badgeName.toLowerCase().replace(/\s+/g, '_');
};

// Returns translation key for category name (use with i18n: t(`transactions.categories.${key}`))
export const getCategoryTranslationKey = (name: string, type: 'INCOME' | 'EXPENSE'): string | null => {
  const expenseCategories: Record<string, string> = {
    'Food': 'food',
    'Transport': 'transport',
    'Entertainment': 'entertainment',
    'Shopping': 'shopping',
    'Bills': 'bills',
    'Health': 'health',
    'Education': 'education',
    'Other': 'other_expense',
  };
  
  const incomeCategories: Record<string, string> = {
    'Salary': 'salary',
    'Freelance': 'freelance',
    'Investment': 'investment',
    'Gift': 'gift',
    'Other': 'other_income',
  };
  
  const map = type === 'INCOME' ? incomeCategories : expenseCategories;
  return map[name] || null;
};

// Returns the RPG name key for a category (use with i18n: t(`resourceBars.${key}`))
export const getCategoryRpgKey = (categoryName: string): string | null => {
  const rpgKeys: Record<string, string> = {
    'Food': 'provisions',
    'Transport': 'travelFuel',
    'Entertainment': 'funEnergy',
    'Shopping': 'treasure',
    'Bills': 'kingdomTax',
    'Health': 'lifeEssence',
    'Education': 'magicScrolls',
    'Other': 'guildFees',
  };
  return rpgKeys[categoryName] || null;
};

// Returns translation key for quest based on quest_key
export const getQuestKey = (questKey: string | null): string | null => {
  if (!questKey) return null;
  
  // Remove UUID suffixes from dynamic quest keys like "achievement_48cad8f4-..."
  const uuidPattern = /^(.+?)_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const match = questKey.match(uuidPattern);
  if (match) {
    // For dynamic quests, map to their base type
    const baseKey = match[1];
    const mappings: Record<string, string> = {
      'achievement': 'achievement_first',
      'daily': 'daily_checkin'
    };
    return mappings[baseKey] || baseKey;
  }
  
  return questKey;
};

// Returns the English title (for database storage - will be translated in UI)
export const getLevelTitle = (level: number): string => {
  const key = getLevelTitleKey(level);
  const titles: Record<string, string> = {
    'novice_saver': 'Novice Saver',
    'budget_apprentice': 'Budget Apprentice',
    'money_manager': 'Money Manager',
    'finance_wizard': 'Finance Wizard',
    'wealth_warrior': 'Wealth Warrior',
    'economy_expert': 'Economy Expert',
    'legendary_investor': 'Legendary Investor',
  };
  return titles[key] || 'Novice Saver';
};

export const calculateStreak = (lastActiveDate: string | null, currentStreak: number = 0): { newStreak: number; isNewDay: boolean } => {
  const today = getTodayString();
  
  if (!lastActiveDate) {
    return { newStreak: 1, isNewDay: true };
  }
  
  // Parse the date as local time to avoid timezone issues
  const lastDate = parseDateString(lastActiveDate);
  const todayDate = parseDateString(today);
  const diffTime = todayDate.getTime() - lastDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return { newStreak: -1, isNewDay: false }; // Same day, no change
  } else if (diffDays === 1) {
    return { newStreak: currentStreak + 1, isNewDay: true }; // Consecutive day, increment streak
  } else {
    return { newStreak: 1, isNewDay: true }; // Streak broken, reset to 1
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
        // Special handling for Referral badges - use referral count instead of transaction count
        if (badge.name.toLowerCase().includes('referral')) {
          const { count: referralCount } = await supabase
            .from('referrals')
            .select('*', { count: 'exact', head: true })
            .eq('referrer_id', userId)
            .in('status', ['completed', 'rewarded']);
          shouldUnlock = (referralCount || 0) >= badge.requirement_value;
        } else {
          shouldUnlock = transactionCount >= badge.requirement_value;
        }
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
  const today = getTodayString();
  const weekStart = getWeekStartString();
  const monthStart = getMonthStartString();

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

    // Achievement quests
    case 'achievement_budget': {
      // Count category goals created by user
      const { count } = await supabase
        .from('category_goals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      return count || 0;
    }

    case 'achievement_first': {
      // Count total transactions
      const { count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      return count || 0;
    }

    case 'achievement_streak7': {
      // Get current streak from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('streak')
        .eq('id', userId)
        .single();
      return profile?.streak || 0;
    }

    case 'achievement_save1000': {
      // Get total saved amount
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_income, total_expenses')
        .eq('id', userId)
        .single();
      if (!profile) return 0;
      return Math.max(0, profile.total_income - profile.total_expenses);
    }

    // New weekly challenge quests
    case 'frugal_friday': {
      // Check if any Friday in the current week had zero expenses
      const weekStartDate = parseDateString(weekStart);
      const todayDate = parseDateString(today);
      let frugalFridayCount = 0;
      
      // Find Fridays in this week
      for (let d = new Date(weekStartDate); d <= todayDate; d.setDate(d.getDate() + 1)) {
        if (d.getDay() === 5) { // Friday
          const fridayStr = formatDateForDB(d);
          const { count } = await supabase
            .from('transactions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('type', 'EXPENSE')
            .eq('date', fridayStr);
          if (count === 0) frugalFridayCount++;
        }
      }
      return frugalFridayCount;
    }

    case 'income_hunter': {
      // Count unique income sources this week
      const { data } = await supabase
        .from('transactions')
        .select('category')
        .eq('user_id', userId)
        .eq('type', 'INCOME')
        .gte('date', weekStart)
        .lte('date', today);
      
      if (!data) return 0;
      return new Set(data.map(t => t.category)).size;
    }

    case 'spending_freeze': {
      // Count days with zero expenses this week
      const { data: expenses } = await supabase
        .from('transactions')
        .select('date')
        .eq('user_id', userId)
        .eq('type', 'EXPENSE')
        .gte('date', weekStart)
        .lte('date', today);
      
      const expenseDays = new Set(expenses?.map(t => t.date) || []);
      const weekStartDate = parseDateString(weekStart);
      const todayDate = parseDateString(today);
      let noSpendDays = 0;
      
      for (let d = new Date(weekStartDate); d <= todayDate; d.setDate(d.getDate() + 1)) {
        const dateStr = formatDateForDB(d);
        if (!expenseDays.has(dateStr)) noSpendDays++;
      }
      return noSpendDays;
    }

    case 'category_focus': {
      // Check if user has kept a category goal under budget this week
      const { data: goals } = await supabase
        .from('category_goals')
        .select('category, budget_limit')
        .eq('user_id', userId);
      
      if (!goals || goals.length === 0) return 0;
      
      const { data: weekExpenses } = await supabase
        .from('transactions')
        .select('category, amount')
        .eq('user_id', userId)
        .eq('type', 'EXPENSE')
        .gte('date', weekStart)
        .lte('date', today);
      
      // Calculate spending by category this week
      const categorySpending: Record<string, number> = {};
      (weekExpenses || []).forEach(t => {
        categorySpending[t.category] = (categorySpending[t.category] || 0) + Number(t.amount);
      });
      
      // Check if at least one category is under 80% of its weekly budget (budget / 4)
      const underControl = goals.some(g => {
        const weeklyBudget = Number(g.budget_limit) / 4;
        const spent = categorySpending[g.category] || 0;
        return spent <= weeklyBudget * 0.8;
      });
      
      return underControl ? 1 : 0;
    }

    case 'savings_sprint': {
      // Check if savings rate >= 20% this week
      const { data: weekData } = await supabase
        .from('transactions')
        .select('amount, type')
        .eq('user_id', userId)
        .gte('date', weekStart)
        .lte('date', today);
      
      if (!weekData) return 0;
      
      const income = weekData.filter(t => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0);
      const expenses = weekData.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0);
      
      if (income === 0) return 0;
      const savingsRate = (income - expenses) / income;
      return savingsRate >= 0.2 ? 1 : 0;
    }

    // === NEW WEEKLY ROTATING CHALLENGES ===
    
    case 'transaction_streak': {
      // Count consecutive days with at least one transaction this week
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

    case 'detailed_tracker': {
      // Count total transactions this week
      const { count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('date', weekStart)
        .lte('date', today);
      return count || 0;
    }

    case 'budget_guardian': {
      // Count categories under their weekly budget limit
      const { data: goals } = await supabase
        .from('category_goals')
        .select('category, budget_limit')
        .eq('user_id', userId);
      
      if (!goals || goals.length === 0) return 0;
      
      const { data: weekExpenses } = await supabase
        .from('transactions')
        .select('category, amount')
        .eq('user_id', userId)
        .eq('type', 'EXPENSE')
        .gte('date', weekStart)
        .lte('date', today);
      
      const categorySpending: Record<string, number> = {};
      (weekExpenses || []).forEach(t => {
        categorySpending[t.category] = (categorySpending[t.category] || 0) + Number(t.amount);
      });
      
      // Count categories under their weekly budget (budget / 4)
      let underBudgetCount = 0;
      for (const goal of goals) {
        const weeklyBudget = Number(goal.budget_limit) / 4;
        const spent = categorySpending[goal.category] || 0;
        if (spent <= weeklyBudget) underBudgetCount++;
      }
      
      return underBudgetCount;
    }

    case 'mini_saver': {
      // Check if income > expenses this week
      const { data: weekData } = await supabase
        .from('transactions')
        .select('amount, type')
        .eq('user_id', userId)
        .gte('date', weekStart)
        .lte('date', today);
      
      if (!weekData) return 0;
      
      const income = weekData.filter(t => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0);
      const expenses = weekData.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0);
      
      return income > expenses ? 1 : 0;
    }

    case 'no_delivery_week': {
      // Check if no food delivery expenses this week
      // Look for "Food" category or description containing delivery keywords
      const { data: foodExpenses } = await supabase
        .from('transactions')
        .select('description')
        .eq('user_id', userId)
        .eq('type', 'EXPENSE')
        .eq('category', 'Food')
        .gte('date', weekStart)
        .lte('date', today);
      
      if (!foodExpenses || foodExpenses.length === 0) return 1;
      
      // Check if any transaction looks like delivery
      const deliveryKeywords = ['ifood', 'rappi', 'uber eats', 'delivery', 'entrega'];
      const hasDelivery = foodExpenses.some(t => 
        deliveryKeywords.some(kw => t.description.toLowerCase().includes(kw))
      );
      
      return hasDelivery ? 0 : 1;
    }

    case 'impulse_control': {
      // Check if no shopping/entertainment expense over R$50 this week
      const { data: bigExpenses } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('type', 'EXPENSE')
        .in('category', ['Shopping', 'Entertainment'])
        .gte('date', weekStart)
        .lte('date', today)
        .gt('amount', 50);
      
      return (!bigExpenses || bigExpenses.length === 0) ? 1 : 0;
    }

    case 'coffee_challenge': {
      // Count days WITHOUT coffee shop expenses
      // This is a bit tricky - we count days WITHOUT coffee
      const { data: coffeeExpenses } = await supabase
        .from('transactions')
        .select('date')
        .eq('user_id', userId)
        .eq('type', 'EXPENSE')
        .gte('date', weekStart)
        .lte('date', today);
      
      // Filter for coffee-related
      const coffeeKeywords = ['café', 'coffee', 'starbucks', 'cafeteria'];
      const coffeeDays = new Set<string>();
      
      (coffeeExpenses || []).forEach(t => {
        // Check description
      });
      
      // Count days in the week
      const weekStartDate = parseDateString(weekStart);
      const todayDate = parseDateString(today);
      let totalDays = 0;
      for (let d = new Date(weekStartDate); d <= todayDate; d.setDate(d.getDate() + 1)) {
        totalDays++;
      }
      
      // For simplicity, return days passed as "skipped" if no coffee category found
      return Math.min(totalDays, 5);
    }

    case 'side_hustle': {
      // Check if any freelance income registered this week
      const { count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('type', 'INCOME')
        .eq('category', 'Freelance')
        .gte('date', weekStart)
        .lte('date', today);
      return (count || 0) > 0 ? 1 : 0;
    }

    case 'cashback_hunter': {
      // Count transactions with "cashback" or "desconto" in description
      const { data: transactions } = await supabase
        .from('transactions')
        .select('description')
        .eq('user_id', userId)
        .gte('date', weekStart)
        .lte('date', today);
      
      if (!transactions) return 0;
      
      const cashbackKeywords = ['cashback', 'desconto', 'cupom', 'promocao', 'promoção'];
      const cashbackCount = transactions.filter(t =>
        cashbackKeywords.some(kw => t.description.toLowerCase().includes(kw))
      ).length;
      
      return cashbackCount;
    }

    case 'expense_reducer': {
      // Compare this week's expenses to last week's
      const lastWeekStart = new Date(parseDateString(weekStart));
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      const lastWeekStartStr = formatDateForDB(lastWeekStart);
      const lastWeekEnd = new Date(parseDateString(weekStart));
      lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
      const lastWeekEndStr = formatDateForDB(lastWeekEnd);
      
      // Get last week's expenses
      const { data: lastWeekExpenses } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('type', 'EXPENSE')
        .gte('date', lastWeekStartStr)
        .lte('date', lastWeekEndStr);
      
      // Get this week's expenses
      const { data: thisWeekExpenses } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('type', 'EXPENSE')
        .gte('date', weekStart)
        .lte('date', today);
      
      const lastWeekTotal = (lastWeekExpenses || []).reduce((s, t) => s + Number(t.amount), 0);
      const thisWeekTotal = (thisWeekExpenses || []).reduce((s, t) => s + Number(t.amount), 0);
      
      if (lastWeekTotal === 0) return 0;
      
      // Check if reduced by 10% or more
      const reduction = (lastWeekTotal - thisWeekTotal) / lastWeekTotal;
      return reduction >= 0.1 ? 1 : 0;
    }

    case 'subscription_audit': {
      // Check if user logged any "Bills" category transaction this week (as review proxy)
      const { count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('type', 'EXPENSE')
        .eq('category', 'Bills')
        .gte('date', weekStart)
        .lte('date', today);
      return (count || 0) > 0 ? 1 : 0;
    }

    // Special seasonal quests
    case 'special_christmas': {
      // Count holiday-related expenses (Shopping, Entertainment, Other)
      const { count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('type', 'EXPENSE')
        .in('category', ['Shopping', 'Entertainment', 'Other']);
      return count || 0;
    }

    case 'special_halloween': {
      // Count any income transactions (savings) in October
      const { count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('type', 'INCOME');
      return count || 0;
    }

    case 'special_easter': {
      // Count unique days with income transactions
      const { data } = await supabase
        .from('transactions')
        .select('date')
        .eq('user_id', userId)
        .eq('type', 'INCOME');
      
      if (!data) return 0;
      const uniqueDays = new Set(data.map(t => t.date));
      return uniqueDays.size;
    }

    case 'special_carnival': {
      // Count entertainment-related expenses
      const { count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('type', 'EXPENSE')
        .in('category', ['Entertainment', 'Food', 'Shopping']);
      return count || 0;
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
  const today = getTodayString();
  const totalSaved = profile.total_income - profile.total_expenses;

  // Calculate how many days since user created their account
  const profileCreatedDays = Math.floor(
    (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  for (const quest of quests) {
    let shouldComplete = false;
    let newProgress = quest.progress_current;

    // Prevent quests from completing too quickly for new users
    // Weekly quests require at least 3 days of activity
    // Monthly quests require at least 7 days of activity
    if (quest.type === 'WEEKLY' && profileCreatedDays < 3) continue;
    if (quest.type === 'MONTHLY' && profileCreatedDays < 7) continue;

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

      // Fetch current XP from database to avoid race condition
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('xp')
        .eq('id', userId)
        .single();
      
      const currentXP = currentProfile?.xp ?? profile.xp;
      const newXP = currentXP + quest.xp_reward;
      const newLevel = getLevelFromXP(newXP);
      const newLevelTitle = getLevelTitle(newLevel);

      // Add XP reward to profile and update level/title
      await supabase
        .from('profiles')
        .update({ 
          xp: newXP, 
          level: newLevel, 
          level_title: newLevelTitle 
        })
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

// Helper functions - re-export from dateUtils for backwards compatibility
export const getWeekStart = (): string => getWeekStartString();

export const getMonthStart = (): string => getMonthStartString();

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
  isExpired: boolean;
} => {
  if (!periodEndDate) {
    return { hours: 0, minutes: 0, days: 0, displayText: 'N/A', isExpired: false };
  }

  const now = new Date();
  const endDate = new Date(periodEndDate + 'T23:59:59');
  const diff = endDate.getTime() - now.getTime();

  if (diff <= 0) {
    return { hours: 0, minutes: 0, days: 0, displayText: 'Resetting...', isExpired: true };
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

  return { hours, minutes, days, displayText, isExpired: false };
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