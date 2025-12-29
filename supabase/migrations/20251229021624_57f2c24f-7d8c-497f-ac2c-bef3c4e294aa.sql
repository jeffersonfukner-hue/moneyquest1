-- Add new columns to quests table
ALTER TABLE public.quests 
ADD COLUMN IF NOT EXISTS period_start_date date,
ADD COLUMN IF NOT EXISTS period_end_date date,
ADD COLUMN IF NOT EXISTS progress_current integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS progress_target integer NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS quest_key text,
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS season text;

-- Update the type column to support new quest types
-- First, update existing ACHIEVEMENT quests to keep them as-is
UPDATE public.quests SET quest_key = 'achievement_' || id WHERE type = 'ACHIEVEMENT';
UPDATE public.quests SET quest_key = 'daily_' || id WHERE type = 'DAILY';

-- Add seasonal badges for special quests
INSERT INTO public.badges (user_id, name, icon, description, requirement_type, requirement_value, is_unlocked)
SELECT p.id, 'Pumpkin Saver', '🎃', 'Completed Halloween quest', 'COUNT', 1, false
FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.badges b WHERE b.user_id = p.id AND b.name = 'Pumpkin Saver');

INSERT INTO public.badges (user_id, name, icon, description, requirement_type, requirement_value, is_unlocked)
SELECT p.id, 'Christmas Planner', '🎄', 'Completed Christmas quest', 'COUNT', 1, false
FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.badges b WHERE b.user_id = p.id AND b.name = 'Christmas Planner');

INSERT INTO public.badges (user_id, name, icon, description, requirement_type, requirement_value, is_unlocked)
SELECT p.id, 'Smart Reveler', '🎭', 'Completed Carnival quest', 'COUNT', 1, false
FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.badges b WHERE b.user_id = p.id AND b.name = 'Smart Reveler');

INSERT INTO public.badges (user_id, name, icon, description, requirement_type, requirement_value, is_unlocked)
SELECT p.id, 'Golden Egg', '🥚', 'Completed Easter quest', 'COUNT', 1, false
FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.badges b WHERE b.user_id = p.id AND b.name = 'Golden Egg');

-- Create function to get start of current period
CREATE OR REPLACE FUNCTION public.get_period_start(period_type text)
RETURNS date
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  CASE period_type
    WHEN 'DAILY' THEN
      RETURN CURRENT_DATE;
    WHEN 'WEEKLY' THEN
      RETURN date_trunc('week', CURRENT_DATE)::date;
    WHEN 'MONTHLY' THEN
      RETURN date_trunc('month', CURRENT_DATE)::date;
    ELSE
      RETURN CURRENT_DATE;
  END CASE;
END;
$$;

-- Create function to get end of current period
CREATE OR REPLACE FUNCTION public.get_period_end(period_type text)
RETURNS date
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  CASE period_type
    WHEN 'DAILY' THEN
      RETURN CURRENT_DATE;
    WHEN 'WEEKLY' THEN
      RETURN (date_trunc('week', CURRENT_DATE) + interval '6 days')::date;
    WHEN 'MONTHLY' THEN
      RETURN (date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day')::date;
    ELSE
      RETURN CURRENT_DATE;
  END CASE;
END;
$$;

-- Update handle_new_user function to create all quest types
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

-- Create function to reset expired quests
CREATE OR REPLACE FUNCTION public.reset_expired_quests(p_user_id uuid)
RETURNS void
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
  -- Reset expired DAILY quests
  UPDATE public.quests 
  SET 
    is_completed = false,
    completed_at = NULL,
    progress_current = 0,
    period_start_date = today,
    period_end_date = today
  WHERE user_id = p_user_id 
    AND type = 'DAILY' 
    AND period_end_date < today;

  -- Reset expired WEEKLY quests
  UPDATE public.quests 
  SET 
    is_completed = false,
    completed_at = NULL,
    progress_current = 0,
    period_start_date = week_start,
    period_end_date = week_end
  WHERE user_id = p_user_id 
    AND type = 'WEEKLY' 
    AND period_end_date < today;

  -- Reset expired MONTHLY quests
  UPDATE public.quests 
  SET 
    is_completed = false,
    completed_at = NULL,
    progress_current = 0,
    period_start_date = month_start,
    period_end_date = month_end
  WHERE user_id = p_user_id 
    AND type = 'MONTHLY' 
    AND period_end_date < today;
END;
$$;