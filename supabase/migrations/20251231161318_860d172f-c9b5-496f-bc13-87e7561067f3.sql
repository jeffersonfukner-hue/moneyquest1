-- Update handle_new_user to use signup metadata for language and currency
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
  user_language text;
  user_currency text;
BEGIN
  -- Get language and currency from signup metadata
  user_language := COALESCE(NEW.raw_user_meta_data->>'language', 'pt-BR');
  user_currency := COALESCE(NEW.raw_user_meta_data->>'currency', 'BRL');

  INSERT INTO public.profiles (id, xp, level, level_title, avatar_icon, streak, total_income, total_expenses, language, locale, currency)
  VALUES (NEW.id, 0, 1, 'Novice Saver', '🎮', 0, 0, 0, user_language, user_language, user_currency);
  
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