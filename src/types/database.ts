export interface Profile {
  id: string;
  xp: number;
  level: number;
  level_title: string;
  avatar_icon: string;
  streak: number;
  total_income: number;
  total_expenses: number;
  last_active_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  category: string;
  type: 'INCOME' | 'EXPENSE';
  date: string;
  xp_earned: number;
  created_at: string;
}

export interface CategoryGoal {
  id: string;
  user_id: string;
  category: string;
  budget_limit: number;
  created_at: string;
}

export interface Quest {
  id: string;
  user_id: string;
  title: string;
  description: string;
  xp_reward: number;
  type: 'DAILY' | 'ACHIEVEMENT';
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface Badge {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  description: string;
  unlocked_at: string | null;
  requirement_type: 'XP' | 'STREAK' | 'TOTAL_SAVED' | 'COUNT';
  requirement_value: number;
  is_unlocked: boolean;
  created_at: string;
}

export type TransactionType = 'INCOME' | 'EXPENSE';
export type QuestType = 'DAILY' | 'ACHIEVEMENT';
export type BadgeRequirementType = 'XP' | 'STREAK' | 'TOTAL_SAVED' | 'COUNT';
