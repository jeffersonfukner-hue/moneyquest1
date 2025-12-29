-- =============================================
-- DAILY LOGIN REWARDS SYSTEM
-- =============================================

-- 1. Create daily_rewards table to track login rewards
CREATE TABLE public.daily_rewards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  last_claim_date date,
  current_streak integer NOT NULL DEFAULT 0,
  total_claims integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own rewards"
ON public.daily_rewards
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rewards"
ON public.daily_rewards
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rewards"
ON public.daily_rewards
FOR UPDATE
USING (auth.uid() = user_id);

-- 2. Create reward_history table for tracking claimed rewards
CREATE TABLE public.reward_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  reward_type text NOT NULL DEFAULT 'daily_login',
  xp_earned integer NOT NULL,
  streak_day integer NOT NULL,
  multiplier numeric NOT NULL DEFAULT 1.0,
  claimed_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reward_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own reward history"
ON public.reward_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reward history"
ON public.reward_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 3. Function to claim daily reward
CREATE OR REPLACE FUNCTION public.claim_daily_reward(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_reward_record daily_rewards%ROWTYPE;
  v_today date := CURRENT_DATE;
  v_yesterday date := CURRENT_DATE - 1;
  v_new_streak integer;
  v_base_xp integer := 25;
  v_multiplier numeric;
  v_bonus_xp integer;
  v_total_xp integer;
  v_is_new_claim boolean := false;
  v_streak_broken boolean := false;
BEGIN
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
  -- Day 1: 1x, Day 2: 1.2x, Day 3: 1.5x, Day 4: 1.8x, Day 5: 2x, Day 6: 2.3x, Day 7+: 2.5x
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

-- 4. Function to check daily reward status
CREATE OR REPLACE FUNCTION public.get_daily_reward_status(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_reward_record daily_rewards%ROWTYPE;
  v_today date := CURRENT_DATE;
  v_yesterday date := CURRENT_DATE - 1;
  v_can_claim boolean;
  v_current_streak integer;
  v_potential_streak integer;
  v_multiplier numeric;
BEGIN
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