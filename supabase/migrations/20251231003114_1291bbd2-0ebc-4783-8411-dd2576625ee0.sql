-- Fix security vulnerability: Add auth.uid() validation to user-facing SECURITY DEFINER functions

-- 1. Update claim_daily_reward to validate user ownership
CREATE OR REPLACE FUNCTION public.claim_daily_reward(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_reward_record daily_rewards%ROWTYPE;
  v_user_timezone text;
  v_today date;
  v_yesterday date;
  v_new_streak integer;
  v_base_xp integer := 25;
  v_multiplier numeric;
  v_bonus_xp integer;
  v_total_xp integer;
  v_is_new_claim boolean := false;
  v_streak_broken boolean := false;
BEGIN
  -- SECURITY: Validate caller owns this user_id
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: You can only claim rewards for your own account';
  END IF;

  -- Get user's timezone
  SELECT COALESCE(timezone, 'America/Sao_Paulo') INTO v_user_timezone
  FROM profiles WHERE id = p_user_id;
  
  -- Calculate today and yesterday in user's timezone
  v_today := (now() AT TIME ZONE v_user_timezone)::date;
  v_yesterday := v_today - 1;

  -- Get or create reward record
  SELECT * INTO v_reward_record
  FROM daily_rewards
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    -- First time claim
    INSERT INTO daily_rewards (user_id, last_claim_date, current_streak, total_claims)
    VALUES (p_user_id, v_today, 1, 1)
    RETURNING * INTO v_reward_record;
    
    v_new_streak := 1;
    v_is_new_claim := true;
  ELSE
    -- Check if already claimed today
    IF v_reward_record.last_claim_date = v_today THEN
      RETURN jsonb_build_object(
        'success', false,
        'already_claimed', true,
        'message', 'Already claimed today',
        'current_streak', v_reward_record.current_streak,
        'next_claim', v_today + 1
      );
    END IF;
    
    -- Calculate new streak
    IF v_reward_record.last_claim_date = v_yesterday THEN
      -- Consecutive day
      v_new_streak := v_reward_record.current_streak + 1;
    ELSE
      -- Streak broken
      v_new_streak := 1;
      v_streak_broken := true;
    END IF;
    
    -- Update record
    UPDATE daily_rewards
    SET 
      last_claim_date = v_today,
      current_streak = v_new_streak,
      total_claims = total_claims + 1,
      updated_at = now()
    WHERE user_id = p_user_id;
    
    v_is_new_claim := true;
  END IF;
  
  -- Calculate multiplier based on streak
  v_multiplier := CASE
    WHEN v_new_streak >= 7 THEN 2.5
    WHEN v_new_streak = 6 THEN 2.3
    WHEN v_new_streak = 5 THEN 2.0
    WHEN v_new_streak = 4 THEN 1.8
    WHEN v_new_streak = 3 THEN 1.5
    WHEN v_new_streak = 2 THEN 1.2
    ELSE 1.0
  END;
  
  v_total_xp := FLOOR(v_base_xp * v_multiplier);
  v_bonus_xp := v_total_xp - v_base_xp;
  
  -- Record reward history
  INSERT INTO reward_history (user_id, reward_type, xp_earned, streak_day, multiplier)
  VALUES (p_user_id, 'daily_login', v_total_xp, v_new_streak, v_multiplier);
  
  -- Add XP to profile
  UPDATE profiles
  SET xp = xp + v_total_xp, updated_at = now()
  WHERE id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'claimed', v_is_new_claim,
    'streak_day', v_new_streak,
    'streak_broken', v_streak_broken,
    'base_xp', v_base_xp,
    'bonus_xp', v_bonus_xp,
    'total_xp', v_total_xp,
    'multiplier', v_multiplier,
    'next_multiplier', CASE
      WHEN v_new_streak >= 7 THEN 2.5
      WHEN v_new_streak = 6 THEN 2.5
      WHEN v_new_streak = 5 THEN 2.3
      WHEN v_new_streak = 4 THEN 2.0
      WHEN v_new_streak = 3 THEN 1.8
      WHEN v_new_streak = 2 THEN 1.5
      ELSE 1.2
    END
  );
END;
$function$;

-- 2. Update get_daily_reward_status to validate user ownership
CREATE OR REPLACE FUNCTION public.get_daily_reward_status(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_reward_record daily_rewards%ROWTYPE;
  v_user_timezone text;
  v_today date;
  v_yesterday date;
  v_can_claim boolean;
  v_current_streak integer;
  v_potential_streak integer;
  v_multiplier numeric;
BEGIN
  -- SECURITY: Validate caller owns this user_id
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: You can only view reward status for your own account';
  END IF;

  -- Get user's timezone
  SELECT COALESCE(timezone, 'America/Sao_Paulo') INTO v_user_timezone
  FROM profiles WHERE id = p_user_id;
  
  -- Calculate today and yesterday in user's timezone
  v_today := (now() AT TIME ZONE v_user_timezone)::date;
  v_yesterday := v_today - 1;
  
  SELECT * INTO v_reward_record
  FROM daily_rewards
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    -- New user, can claim first reward
    RETURN jsonb_build_object(
      'can_claim', true,
      'current_streak', 0,
      'potential_streak', 1,
      'multiplier', 1.0,
      'last_claim', null,
      'total_claims', 0
    );
  END IF;
  
  v_can_claim := v_reward_record.last_claim_date IS NULL OR v_reward_record.last_claim_date < v_today;
  
  -- Calculate potential streak if claimed today
  IF v_reward_record.last_claim_date = v_yesterday THEN
    v_potential_streak := v_reward_record.current_streak + 1;
    v_current_streak := v_reward_record.current_streak;
  ELSIF v_reward_record.last_claim_date = v_today THEN
    v_potential_streak := v_reward_record.current_streak;
    v_current_streak := v_reward_record.current_streak;
  ELSE
    v_potential_streak := 1;
    v_current_streak := 0; -- Streak will be reset
  END IF;
  
  v_multiplier := CASE
    WHEN v_potential_streak >= 7 THEN 2.5
    WHEN v_potential_streak = 6 THEN 2.3
    WHEN v_potential_streak = 5 THEN 2.0
    WHEN v_potential_streak = 4 THEN 1.8
    WHEN v_potential_streak = 3 THEN 1.5
    WHEN v_potential_streak = 2 THEN 1.2
    ELSE 1.0
  END;
  
  RETURN jsonb_build_object(
    'can_claim', v_can_claim,
    'current_streak', v_current_streak,
    'potential_streak', v_potential_streak,
    'multiplier', v_multiplier,
    'last_claim', v_reward_record.last_claim_date,
    'total_claims', v_reward_record.total_claims
  );
END;
$function$;

-- 3. Update reset_expired_quests to validate user ownership
CREATE OR REPLACE FUNCTION public.reset_expired_quests(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_timezone text;
  today date;
  week_start date;
  week_end date;
  month_start date;
  month_end date;
BEGIN
  -- SECURITY: Validate caller owns this user_id
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: You can only reset quests for your own account';
  END IF;

  -- Get user's timezone
  SELECT COALESCE(timezone, 'America/Sao_Paulo') INTO v_user_timezone
  FROM profiles WHERE id = p_user_id;
  
  -- Calculate dates in user's timezone
  today := (now() AT TIME ZONE v_user_timezone)::date;
  week_start := date_trunc('week', today)::date;
  week_end := (date_trunc('week', today) + interval '6 days')::date;
  month_start := date_trunc('month', today)::date;
  month_end := (date_trunc('month', today) + interval '1 month' - interval '1 day')::date;

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
$function$;

-- 4. Update archive_monthly_goals to validate user ownership
CREATE OR REPLACE FUNCTION public.archive_monthly_goals(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_month INTEGER := EXTRACT(MONTH FROM CURRENT_DATE);
  current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
  prev_month INTEGER;
  prev_year INTEGER;
  month_start DATE;
  month_end DATE;
BEGIN
  -- SECURITY: Validate caller owns this user_id
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: You can only archive goals for your own account';
  END IF;

  -- Calculate previous month
  IF current_month = 1 THEN
    prev_month := 12;
    prev_year := current_year - 1;
  ELSE
    prev_month := current_month - 1;
    prev_year := current_year;
  END IF;
  
  -- Calculate previous month date range
  month_start := make_date(prev_year, prev_month, 1);
  month_end := (month_start + INTERVAL '1 month' - INTERVAL '1 day')::date;
  
  -- Archive each goal's performance for the previous month
  INSERT INTO public.category_goal_history (
    user_id,
    goal_id,
    category,
    budget_limit,
    spent,
    percentage_used,
    status,
    period_month,
    period_year
  )
  SELECT 
    g.user_id,
    g.id as goal_id,
    g.category,
    g.budget_limit,
    COALESCE(SUM(t.amount), 0) as spent,
    CASE 
      WHEN g.budget_limit > 0 THEN ROUND((COALESCE(SUM(t.amount), 0) / g.budget_limit) * 100, 1)
      ELSE 0
    END as percentage_used,
    CASE 
      WHEN COALESCE(SUM(t.amount), 0) <= g.budget_limit * 0.8 THEN 'excellent'
      WHEN COALESCE(SUM(t.amount), 0) <= g.budget_limit THEN 'within_budget'
      ELSE 'over_budget'
    END as status,
    prev_month,
    prev_year
  FROM public.category_goals g
  LEFT JOIN public.transactions t ON 
    t.user_id = g.user_id 
    AND t.category = g.category 
    AND t.type = 'EXPENSE'
    AND t.date >= month_start
    AND t.date <= month_end
  WHERE g.user_id = p_user_id
  GROUP BY g.id, g.user_id, g.category, g.budget_limit
  ON CONFLICT (user_id, category, period_month, period_year) 
  DO UPDATE SET
    budget_limit = EXCLUDED.budget_limit,
    spent = EXCLUDED.spent,
    percentage_used = EXCLUDED.percentage_used,
    status = EXCLUDED.status;
END;
$function$;

-- 5. Update create_default_categories to validate user ownership
CREATE OR REPLACE FUNCTION public.create_default_categories(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- SECURITY: Validate caller owns this user_id (skip for trigger context where auth.uid() is null)
  IF auth.uid() IS NOT NULL AND p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: You can only create categories for your own account';
  END IF;

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
$function$;