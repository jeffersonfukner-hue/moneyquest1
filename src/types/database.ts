export type FinancialMood = 'VERY_POSITIVE' | 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'CRITICAL';

export type SupportedLanguage = 'pt-BR' | 'pt-PT' | 'en-US' | 'es-ES';
export type SupportedCurrency = 'BRL' | 'USD' | 'EUR';
export type SubscriptionPlan = 'FREE' | 'PREMIUM';
export type ThemePreference = 'light' | 'dark' | 'system';
export type PremiumOverride = 'none' | 'force_on' | 'force_off';

export interface NotificationPreferences {
  messages: boolean;
  support: boolean;
  referral: boolean;
  reward: boolean;
}

export interface Profile {
  id: string;
  xp: number;
  level: number;
  level_title: string;
  avatar_icon: string;
  avatar_url: string | null;
  display_name: string | null;
  streak: number;
  total_income: number;
  total_expenses: number;
  last_active_date: string | null;
  financial_mood: FinancialMood;
  language: SupportedLanguage;
  locale: string;
  currency: SupportedCurrency;
  subscription_plan: SubscriptionPlan;
  subscription_started_at: string | null;
  subscription_expires_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_subscription_status: string | null;
  premium_override: PremiumOverride;
  theme_preference: ThemePreference;
  timezone: string;
  onboarding_completed: boolean;
  notification_preferences: NotificationPreferences;
  created_at: string;
  updated_at: string;
  // Trial premium fields
  trial_start_date: string | null;
  trial_end_date: string | null;
  has_used_trial: boolean;
  // Discount offer fields
  discount_offer_shown: boolean;
  discount_offer_expires_at: string | null;
  // Shop & currency fields
  xp_conversivel: number;
  mq_coins: number;
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
  currency: SupportedCurrency;
  wallet_id: string | null;
  credit_card_id?: string | null;
  invoice_id?: string | null;
  source_type?: string;
  transaction_subtype?: string;
  has_items?: boolean;
  is_manual?: boolean;
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
  type: QuestType;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  // New fields for enhanced quest system
  period_start_date: string | null;
  period_end_date: string | null;
  progress_current: number;
  progress_target: number;
  quest_key: string | null;
  is_active: boolean;
  season: string | null;
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

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  icon: string;
  color: string;
  is_default: boolean;
  created_at: string;
}

export interface ExchangeRate {
  id: string;
  base_currency: SupportedCurrency;
  target_currency: SupportedCurrency;
  rate: number;
  updated_at: string;
}

export type TransactionType = 'INCOME' | 'EXPENSE';
export type QuestType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SPECIAL' | 'ACHIEVEMENT';
export type BadgeRequirementType = 'XP' | 'STREAK' | 'TOTAL_SAVED' | 'COUNT';
