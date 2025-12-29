-- Create categories table for user-defined income/expense categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
  icon TEXT DEFAULT '📦',
  color TEXT DEFAULT '#8B5CF6',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Unique index to prevent duplicate category names per user and type
CREATE UNIQUE INDEX categories_user_name_type_idx 
  ON public.categories(user_id, LOWER(name), type);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories
CREATE POLICY "Users can view own categories" 
  ON public.categories FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own categories" 
  ON public.categories FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" 
  ON public.categories FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" 
  ON public.categories FOR DELETE 
  USING (auth.uid() = user_id AND is_default = false);

-- Create exchange_rates table for currency conversion
CREATE TABLE public.exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency TEXT NOT NULL,
  target_currency TEXT NOT NULL,
  rate NUMERIC NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(base_currency, target_currency)
);

-- Exchange rates are public read, only system can write
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read exchange rates" 
  ON public.exchange_rates FOR SELECT 
  USING (true);

-- Function to create default categories for a user
CREATE OR REPLACE FUNCTION public.create_default_categories(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Default expense categories
  INSERT INTO public.categories (user_id, name, type, icon, color, is_default) VALUES
    (p_user_id, 'Food', 'EXPENSE', '🍔', '#EF4444', true),
    (p_user_id, 'Transport', 'EXPENSE', '🚗', '#3B82F6', true),
    (p_user_id, 'Entertainment', 'EXPENSE', '🎮', '#8B5CF6', true),
    (p_user_id, 'Shopping', 'EXPENSE', '🛍️', '#EC4899', true),
    (p_user_id, 'Bills', 'EXPENSE', '📄', '#F59E0B', true),
    (p_user_id, 'Health', 'EXPENSE', '💊', '#10B981', true),
    (p_user_id, 'Education', 'EXPENSE', '📚', '#6366F1', true),
    (p_user_id, 'Other', 'EXPENSE', '📦', '#6B7280', true);
  
  -- Default income categories
  INSERT INTO public.categories (user_id, name, type, icon, color, is_default) VALUES
    (p_user_id, 'Salary', 'INCOME', '💰', '#10B981', true),
    (p_user_id, 'Freelance', 'INCOME', '💼', '#3B82F6', true),
    (p_user_id, 'Investment', 'INCOME', '📈', '#8B5CF6', true),
    (p_user_id, 'Gift', 'INCOME', '🎁', '#EC4899', true),
    (p_user_id, 'Other', 'INCOME', '💵', '#6B7280', true);
END;
$$;

-- Update handle_new_user function to also create default categories
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  today date := CURRENT_DATE;
  week_start date := date_trunc('week', CURRENT_DATE)::date;
  week_end date := (date_trunc('week', CURRENT_DATE) + interval '6 days')::date;
  month_start date := date_trunc('month', CURRENT_DATE)::date;
  month_end date := (date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day')::date;
BEGIN
  INSERT INTO public.profiles (id, xp, level, level_title, avatar_icon, streak, total_income, total_expenses)
  VALUES (NEW.id, 0, 1, 'Novice Saver', '🎮', 0, 0, 0);
  
  -- Create default categories for new user
  PERFORM public.create_default_categories(NEW.id);
  
  -- Create DAILY quests
  INSERT INTO public.quests (user_id, title, description, xp_reward, type, quest_key, progress_target, period_start_date, period_end_date) VALUES
    (NEW.id, 'Daily Check-in', 'Log at least one transaction today', 50, 'DAILY', 'daily_checkin', 1, today, today),
    (NEW.id, 'Expense Tracker', 'Register an expense for the day', 70, 'DAILY', 'daily_expense', 1, today, today),
    (NEW.id, 'Mindful Spending', 'Log an expense with a category', 40, 'DAILY', 'daily_categorized', 1, today, today);
  
  -- Create WEEKLY quests
  INSERT INTO public.quests (user_id, title, description, xp_reward, type, quest_key, progress_target, period_start_date, period_end_date) VALUES
    (NEW.id, 'Weekly Balance', 'Log transactions on at least 5 different days this week', 200, 'WEEKLY', 'weekly_balance', 5, week_start, week_end),
    (NEW.id, 'Category Master', 'Use at least 3 different expense categories this week', 150, 'WEEKLY', 'weekly_categories', 3, week_start, week_end);
  
  -- Create MONTHLY quests
  INSERT INTO public.quests (user_id, title, description, xp_reward, type, quest_key, progress_target, period_start_date, period_end_date) VALUES
    (NEW.id, 'Financial Discipline', 'Log transactions every week of the month', 500, 'MONTHLY', 'monthly_discipline', 4, month_start, month_end),
    (NEW.id, 'Savings Hero', 'Keep total expenses below your goal limit', 400, 'MONTHLY', 'monthly_savings', 1, month_start, month_end);
  
  -- Create ACHIEVEMENT quests (one-time)
  INSERT INTO public.quests (user_id, title, description, xp_reward, type, quest_key, progress_target) VALUES
    (NEW.id, 'First Steps', 'Log your first transaction', 100, 'ACHIEVEMENT', 'achievement_first', 1),
    (NEW.id, 'Budget Master', 'Set your first category goal', 75, 'ACHIEVEMENT', 'achievement_budget', 1),
    (NEW.id, 'Week Warrior', 'Maintain a 7-day streak', 200, 'ACHIEVEMENT', 'achievement_streak7', 7),
    (NEW.id, 'Saver Supreme', 'Save $1000 total', 500, 'ACHIEVEMENT', 'achievement_save1000', 1000);
  
  -- Create default badges for new user
  INSERT INTO public.badges (user_id, name, icon, description, requirement_type, requirement_value) VALUES
    (NEW.id, 'First Steps', '👣', 'Logged your first transaction', 'COUNT', 1),
    (NEW.id, 'Getting Started', '🌟', 'Reached 100 XP', 'XP', 100),
    (NEW.id, 'Rising Star', '⭐', 'Reached 500 XP', 'XP', 500),
    (NEW.id, 'XP Champion', '🏆', 'Reached 1000 XP', 'XP', 1000),
    (NEW.id, 'Streak Starter', '🔥', '3-day streak', 'STREAK', 3),
    (NEW.id, 'Streak Master', '💪', '7-day streak', 'STREAK', 7),
    (NEW.id, 'Penny Pincher', '💰', 'Saved $100', 'TOTAL_SAVED', 100),
    (NEW.id, 'Savings Pro', '💎', 'Saved $1000', 'TOTAL_SAVED', 1000),
    (NEW.id, 'Pumpkin Saver', '🎃', 'Completed Halloween quest', 'COUNT', 1),
    (NEW.id, 'Christmas Planner', '🎄', 'Completed Christmas quest', 'COUNT', 1),
    (NEW.id, 'Smart Reveler', '🎭', 'Completed Carnival quest', 'COUNT', 1),
    (NEW.id, 'Golden Egg', '🥚', 'Completed Easter quest', 'COUNT', 1);
  
  RETURN NEW;
END;
$$;

-- Insert default exchange rates (fallback values)
INSERT INTO public.exchange_rates (base_currency, target_currency, rate) VALUES
  ('USD', 'BRL', 5.00),
  ('USD', 'EUR', 0.92),
  ('BRL', 'USD', 0.20),
  ('BRL', 'EUR', 0.18),
  ('EUR', 'USD', 1.09),
  ('EUR', 'BRL', 5.45)
ON CONFLICT (base_currency, target_currency) DO UPDATE SET rate = EXCLUDED.rate, updated_at = now();