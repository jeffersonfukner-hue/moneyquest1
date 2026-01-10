/**
 * Weekly Challenges Pool - Rotating Weekly Challenges System
 * 
 * This module defines a pool of 18+ weekly challenges that rotate automatically.
 * Each week, 3-5 challenges are selected based on the week number to ensure variety.
 */

export interface WeeklyChallenge {
  key: string;
  titleKey: string; // i18n key
  descriptionKey: string; // i18n key
  xpReward: number;
  progressTarget: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'savings' | 'tracking' | 'discipline' | 'income' | 'reduction';
  icon: string;
}

/**
 * Pool of 18 weekly challenges
 * Each has unique mechanics and rewards scaled by difficulty
 */
export const WEEKLY_CHALLENGES_POOL: WeeklyChallenge[] = [
  // === TRACKING CHALLENGES ===
  {
    key: 'weekly_balance',
    titleKey: 'weeklyChallenges.weekly_balance.title',
    descriptionKey: 'weeklyChallenges.weekly_balance.description',
    xpReward: 200,
    progressTarget: 5,
    difficulty: 'medium',
    category: 'tracking',
    icon: '📊'
  },
  {
    key: 'weekly_categories',
    titleKey: 'weeklyChallenges.weekly_categories.title',
    descriptionKey: 'weeklyChallenges.weekly_categories.description',
    xpReward: 150,
    progressTarget: 3,
    difficulty: 'easy',
    category: 'tracking',
    icon: '🏷️'
  },
  {
    key: 'transaction_streak',
    titleKey: 'weeklyChallenges.transaction_streak.title',
    descriptionKey: 'weeklyChallenges.transaction_streak.description',
    xpReward: 250,
    progressTarget: 7,
    difficulty: 'hard',
    category: 'tracking',
    icon: '🔥'
  },
  {
    key: 'detailed_tracker',
    titleKey: 'weeklyChallenges.detailed_tracker.title',
    descriptionKey: 'weeklyChallenges.detailed_tracker.description',
    xpReward: 175,
    progressTarget: 10,
    difficulty: 'medium',
    category: 'tracking',
    icon: '📝'
  },

  // === SAVINGS CHALLENGES ===
  {
    key: 'savings_sprint',
    titleKey: 'weeklyChallenges.savings_sprint.title',
    descriptionKey: 'weeklyChallenges.savings_sprint.description',
    xpReward: 250,
    progressTarget: 1,
    difficulty: 'hard',
    category: 'savings',
    icon: '💰'
  },
  {
    key: 'category_focus',
    titleKey: 'weeklyChallenges.category_focus.title',
    descriptionKey: 'weeklyChallenges.category_focus.description',
    xpReward: 180,
    progressTarget: 1,
    difficulty: 'medium',
    category: 'savings',
    icon: '🎯'
  },
  {
    key: 'budget_guardian',
    titleKey: 'weeklyChallenges.budget_guardian.title',
    descriptionKey: 'weeklyChallenges.budget_guardian.description',
    xpReward: 220,
    progressTarget: 3,
    difficulty: 'medium',
    category: 'savings',
    icon: '🛡️'
  },
  {
    key: 'mini_saver',
    titleKey: 'weeklyChallenges.mini_saver.title',
    descriptionKey: 'weeklyChallenges.mini_saver.description',
    xpReward: 150,
    progressTarget: 1,
    difficulty: 'easy',
    category: 'savings',
    icon: '🐷'
  },

  // === DISCIPLINE CHALLENGES ===
  {
    key: 'spending_freeze',
    titleKey: 'weeklyChallenges.spending_freeze.title',
    descriptionKey: 'weeklyChallenges.spending_freeze.description',
    xpReward: 200,
    progressTarget: 2,
    difficulty: 'medium',
    category: 'discipline',
    icon: '❄️'
  },
  {
    key: 'no_delivery_week',
    titleKey: 'weeklyChallenges.no_delivery_week.title',
    descriptionKey: 'weeklyChallenges.no_delivery_week.description',
    xpReward: 175,
    progressTarget: 1,
    difficulty: 'medium',
    category: 'discipline',
    icon: '🍳'
  },
  {
    key: 'impulse_control',
    titleKey: 'weeklyChallenges.impulse_control.title',
    descriptionKey: 'weeklyChallenges.impulse_control.description',
    xpReward: 200,
    progressTarget: 1,
    difficulty: 'medium',
    category: 'discipline',
    icon: '🧠'
  },
  {
    key: 'coffee_challenge',
    titleKey: 'weeklyChallenges.coffee_challenge.title',
    descriptionKey: 'weeklyChallenges.coffee_challenge.description',
    xpReward: 125,
    progressTarget: 5,
    difficulty: 'easy',
    category: 'discipline',
    icon: '☕'
  },

  // === INCOME CHALLENGES ===
  {
    key: 'income_hunter',
    titleKey: 'weeklyChallenges.income_hunter.title',
    descriptionKey: 'weeklyChallenges.income_hunter.description',
    xpReward: 175,
    progressTarget: 2,
    difficulty: 'medium',
    category: 'income',
    icon: '🎯'
  },
  {
    key: 'side_hustle',
    titleKey: 'weeklyChallenges.side_hustle.title',
    descriptionKey: 'weeklyChallenges.side_hustle.description',
    xpReward: 200,
    progressTarget: 1,
    difficulty: 'medium',
    category: 'income',
    icon: '💼'
  },
  {
    key: 'cashback_hunter',
    titleKey: 'weeklyChallenges.cashback_hunter.title',
    descriptionKey: 'weeklyChallenges.cashback_hunter.description',
    xpReward: 125,
    progressTarget: 3,
    difficulty: 'easy',
    category: 'income',
    icon: '🏷️'
  },

  // === REDUCTION CHALLENGES ===
  {
    key: 'expense_reducer',
    titleKey: 'weeklyChallenges.expense_reducer.title',
    descriptionKey: 'weeklyChallenges.expense_reducer.description',
    xpReward: 225,
    progressTarget: 1,
    difficulty: 'hard',
    category: 'reduction',
    icon: '📉'
  },
  {
    key: 'subscription_audit',
    titleKey: 'weeklyChallenges.subscription_audit.title',
    descriptionKey: 'weeklyChallenges.subscription_audit.description',
    xpReward: 150,
    progressTarget: 1,
    difficulty: 'easy',
    category: 'reduction',
    icon: '🔍'
  },
];

/**
 * Get a deterministic but varied selection of weekly challenges based on the week number
 * This ensures all users get the same challenges each week, but they vary week to week
 */
export const getWeeklyChallengesForWeek = (weekNumber: number, year: number): WeeklyChallenge[] => {
  // Create a seed from week and year for deterministic but varied selection
  const seed = (weekNumber * 7 + year) % 100;
  
  // Shuffle pool based on seed
  const shuffled = [...WEEKLY_CHALLENGES_POOL].sort((a, b) => {
    const aHash = (a.key.charCodeAt(0) + seed) % 100;
    const bHash = (b.key.charCodeAt(0) + seed) % 100;
    return aHash - bHash;
  });
  
  // Select 4-5 challenges ensuring variety in categories and difficulty
  const selected: WeeklyChallenge[] = [];
  const usedCategories = new Set<string>();
  const difficulties = { easy: 0, medium: 0, hard: 0 };
  
  for (const challenge of shuffled) {
    if (selected.length >= 5) break;
    
    // Ensure category variety (max 2 per category)
    const categoryCount = selected.filter(c => c.category === challenge.category).length;
    if (categoryCount >= 2) continue;
    
    // Ensure difficulty balance
    if (difficulties[challenge.difficulty] >= 2) continue;
    
    selected.push(challenge);
    difficulties[challenge.difficulty]++;
  }
  
  // Ensure at least 4 challenges
  while (selected.length < 4 && shuffled.length > selected.length) {
    const remaining = shuffled.filter(c => !selected.includes(c));
    if (remaining.length > 0) {
      selected.push(remaining[0]);
    } else {
      break;
    }
  }
  
  return selected;
};

/**
 * Get current week number of the year
 */
export const getCurrentWeekNumber = (): { week: number; year: number } => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const oneWeek = 604800000; // milliseconds in a week
  const week = Math.ceil((diff / oneWeek) + start.getDay() / 7);
  return { week, year: now.getFullYear() };
};

/**
 * Get the challenges for the current week
 */
export const getCurrentWeekChallenges = (): WeeklyChallenge[] => {
  const { week, year } = getCurrentWeekNumber();
  return getWeeklyChallengesForWeek(week, year);
};

/**
 * Check if a challenge key is in this week's rotation
 */
export const isChallengeActiveThisWeek = (challengeKey: string): boolean => {
  const currentChallenges = getCurrentWeekChallenges();
  return currentChallenges.some(c => c.key === challengeKey);
};

/**
 * Get challenge config by key
 */
export const getChallengeByKey = (key: string): WeeklyChallenge | undefined => {
  return WEEKLY_CHALLENGES_POOL.find(c => c.key === key);
};
