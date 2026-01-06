-- Fix claim_daily_reward to also update xp_conversivel
CREATE OR REPLACE FUNCTION claim_daily_reward(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  
  -- Add XP to profile (both xp and xp_conversivel)
  UPDATE profiles
  SET 
    xp = xp + v_total_xp, 
    xp_conversivel = COALESCE(xp_conversivel, 0) + v_total_xp,
    updated_at = now()
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
$$;