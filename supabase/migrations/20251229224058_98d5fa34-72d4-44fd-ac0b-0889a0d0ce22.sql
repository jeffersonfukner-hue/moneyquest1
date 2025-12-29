-- =============================================
-- GAMIFICATION EXPANSION: New Quests, Leaderboard, Friends
-- =============================================

-- 1. Create leaderboard_participants table for opt-in leaderboard
CREATE TABLE public.leaderboard_participants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  display_name text NOT NULL,
  avatar_icon text NOT NULL DEFAULT '🎮',
  xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  is_public boolean DEFAULT true,
  joined_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leaderboard_participants ENABLE ROW LEVEL SECURITY;

-- Anyone can view public leaderboard entries
CREATE POLICY "Anyone can view public leaderboard entries"
ON public.leaderboard_participants
FOR SELECT
USING (is_public = true);

-- Users can view their own entry regardless of public status
CREATE POLICY "Users can view own leaderboard entry"
ON public.leaderboard_participants
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own entry
CREATE POLICY "Users can join leaderboard"
ON public.leaderboard_participants
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own entry
CREATE POLICY "Users can update own leaderboard entry"
ON public.leaderboard_participants
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own entry (leave leaderboard)
CREATE POLICY "Users can leave leaderboard"
ON public.leaderboard_participants
FOR DELETE
USING (auth.uid() = user_id);

-- 2. Create friend_connections table for friends leaderboard
CREATE TABLE public.friend_connections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  friend_id uuid NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Enable RLS
ALTER TABLE public.friend_connections ENABLE ROW LEVEL SECURITY;

-- Users can view their own friend connections (sent or received)
CREATE POLICY "Users can view own friend connections"
ON public.friend_connections
FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Users can send friend requests
CREATE POLICY "Users can send friend requests"
ON public.friend_connections
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update connections they're part of (accept/reject)
CREATE POLICY "Users can respond to friend requests"
ON public.friend_connections
FOR UPDATE
USING (auth.uid() = friend_id);

-- Users can delete their own sent requests
CREATE POLICY "Users can delete own friend requests"
ON public.friend_connections
FOR DELETE
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- 3. Add new weekly challenge quests to existing users
DO $$
DECLARE
  user_record RECORD;
  week_start date := date_trunc('week', CURRENT_DATE)::date;
  week_end date := (date_trunc('week', CURRENT_DATE) + interval '6 days')::date;
BEGIN
  FOR user_record IN SELECT id FROM profiles LOOP
    -- Frugal Friday
    INSERT INTO public.quests (user_id, title, description, xp_reward, type, quest_key, progress_target, period_start_date, period_end_date)
    VALUES (user_record.id, 'Frugal Friday', 'Don''t spend anything on at least one Friday this week', 150, 'WEEKLY', 'frugal_friday', 1, week_start, week_end)
    ON CONFLICT DO NOTHING;
    
    -- Income Hunter
    INSERT INTO public.quests (user_id, title, description, xp_reward, type, quest_key, progress_target, period_start_date, period_end_date)
    VALUES (user_record.id, 'Income Hunter', 'Log income from 2 different sources this week', 175, 'WEEKLY', 'income_hunter', 2, week_start, week_end)
    ON CONFLICT DO NOTHING;
    
    -- Spending Freeze
    INSERT INTO public.quests (user_id, title, description, xp_reward, type, quest_key, progress_target, period_start_date, period_end_date)
    VALUES (user_record.id, 'Spending Freeze', 'Have at least 2 no-spend days this week', 200, 'WEEKLY', 'spending_freeze', 2, week_start, week_end)
    ON CONFLICT DO NOTHING;
    
    -- Category Focus
    INSERT INTO public.quests (user_id, title, description, xp_reward, type, quest_key, progress_target, period_start_date, period_end_date)
    VALUES (user_record.id, 'Category Focus', 'Keep your highest spending category under control this week', 180, 'WEEKLY', 'category_focus', 1, week_start, week_end)
    ON CONFLICT DO NOTHING;
    
    -- Savings Sprint
    INSERT INTO public.quests (user_id, title, description, xp_reward, type, quest_key, progress_target, period_start_date, period_end_date)
    VALUES (user_record.id, 'Savings Sprint', 'Save at least 20% of your income this week', 250, 'WEEKLY', 'savings_sprint', 1, week_start, week_end)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- 4. Update handle_new_user function to include new quests
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  
  -- Create WEEKLY quests (including new challenge quests)
  INSERT INTO public.quests (user_id, title, description, xp_reward, type, quest_key, progress_target, period_start_date, period_end_date) VALUES
    (NEW.id, 'Weekly Balance', 'Log transactions on at least 5 different days this week', 200, 'WEEKLY', 'weekly_balance', 5, week_start, week_end),
    (NEW.id, 'Category Master', 'Use at least 3 different expense categories this week', 150, 'WEEKLY', 'weekly_categories', 3, week_start, week_end),
    (NEW.id, 'Frugal Friday', 'Don''t spend anything on at least one Friday this week', 150, 'WEEKLY', 'frugal_friday', 1, week_start, week_end),
    (NEW.id, 'Income Hunter', 'Log income from 2 different sources this week', 175, 'WEEKLY', 'income_hunter', 2, week_start, week_end),
    (NEW.id, 'Spending Freeze', 'Have at least 2 no-spend days this week', 200, 'WEEKLY', 'spending_freeze', 2, week_start, week_end),
    (NEW.id, 'Category Focus', 'Keep your highest spending category under control this week', 180, 'WEEKLY', 'category_focus', 1, week_start, week_end),
    (NEW.id, 'Savings Sprint', 'Save at least 20% of your income this week', 250, 'WEEKLY', 'savings_sprint', 1, week_start, week_end);
  
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
$function$;

-- 5. Function to sync leaderboard when profile updates
CREATE OR REPLACE FUNCTION public.sync_leaderboard_on_profile_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.leaderboard_participants
  SET 
    xp = NEW.xp,
    level = NEW.level,
    display_name = COALESCE(NEW.display_name, display_name),
    avatar_icon = NEW.avatar_icon,
    updated_at = now()
  WHERE user_id = NEW.id;
  
  RETURN NEW;
END;
$function$;

-- Create trigger to sync leaderboard
CREATE TRIGGER sync_leaderboard_trigger
AFTER UPDATE OF xp, level, display_name, avatar_icon ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_leaderboard_on_profile_update();