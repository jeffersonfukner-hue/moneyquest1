-- Add timezone column to profiles for user-specific midnight calculations
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'America/Sao_Paulo';

-- Update get_daily_reward_status to use user's timezone
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

-- Update claim_daily_reward to use user's timezone
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

-- Update reset_expired_quests to use user's timezone
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