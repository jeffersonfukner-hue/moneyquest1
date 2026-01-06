-- Drop both versions of the function first
DROP FUNCTION IF EXISTS public.convert_xp_to_coins(uuid, integer);
DROP FUNCTION IF EXISTS public.convert_xp_to_coins(uuid, integer, integer);

-- Recreate the function with proper signature
CREATE FUNCTION public.convert_xp_to_coins(
  p_user_id uuid,
  p_xp_amount integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
  v_rate INTEGER;
  v_daily_limit INTEGER;
  v_daily_converted INTEGER;
  v_daily_remaining INTEGER;
  v_coins_earned INTEGER;
  v_boost_multiplier NUMERIC := 1.0;
  v_is_premium BOOLEAN;
  v_tier TEXT;
  v_level INTEGER;
BEGIN
  -- Get profile info
  SELECT 
    xp_conversivel, 
    mq_coins, 
    level,
    CASE 
      WHEN subscription_plan = 'PREMIUM' 
        OR premium_override = 'force_on'
        OR (trial_end_date IS NOT NULL AND trial_end_date > now())
      THEN true 
      ELSE false 
    END as is_premium
  INTO v_profile
  FROM profiles
  WHERE id = p_user_id;

  IF v_profile IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'user_not_found');
  END IF;

  v_is_premium := v_profile.is_premium;
  v_level := v_profile.level;

  -- Determine tier and rate based on level/premium
  IF v_is_premium THEN
    v_tier := 'premium';
    v_rate := 8;
    v_daily_limit := 10000;
  ELSIF v_level >= 15 THEN
    v_tier := 'advanced';
    v_rate := 8;
    v_daily_limit := 5000;
  ELSIF v_level >= 5 THEN
    v_tier := 'intermediate';
    v_rate := 10;
    v_daily_limit := 2000;
  ELSE
    v_tier := 'beginner';
    v_rate := 15;
    v_daily_limit := 500;
  END IF;

  -- Validate amount
  IF p_xp_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_amount');
  END IF;

  IF p_xp_amount < v_rate THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_xp_for_coin');
  END IF;

  IF v_profile.xp_conversivel < p_xp_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_xp');
  END IF;

  -- Check daily limit
  SELECT COALESCE(xp_converted, 0)
  INTO v_daily_converted
  FROM daily_conversion_limits
  WHERE user_id = p_user_id AND conversion_date = CURRENT_DATE;

  IF v_daily_converted IS NULL THEN
    v_daily_converted := 0;
  END IF;

  v_daily_remaining := v_daily_limit - v_daily_converted;

  IF v_daily_remaining <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'daily_limit_reached');
  END IF;

  -- Limit conversion to daily remaining
  IF p_xp_amount > v_daily_remaining THEN
    p_xp_amount := v_daily_remaining;
  END IF;

  -- Check for active boost
  SELECT COALESCE(valor, 1.0)
  INTO v_boost_multiplier
  FROM active_effects
  WHERE usuario_id = p_user_id 
    AND tipo_efeito = 'boost_conversao'
    AND ativo = true
    AND (data_expiracao IS NULL OR data_expiracao > now())
  ORDER BY valor DESC
  LIMIT 1;

  IF v_boost_multiplier IS NULL THEN
    v_boost_multiplier := 1.0;
  END IF;

  -- Calculate coins earned
  v_coins_earned := FLOOR((p_xp_amount::NUMERIC / v_rate::NUMERIC) * v_boost_multiplier);

  IF v_coins_earned <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_xp_for_coin');
  END IF;

  -- Update profile
  UPDATE profiles
  SET 
    xp_conversivel = xp_conversivel - p_xp_amount,
    mq_coins = mq_coins + v_coins_earned,
    updated_at = now()
  WHERE id = p_user_id;

  -- Update daily conversion limit
  INSERT INTO daily_conversion_limits (user_id, conversion_date, xp_converted, coins_received)
  VALUES (p_user_id, CURRENT_DATE, p_xp_amount, v_coins_earned)
  ON CONFLICT (user_id, conversion_date) 
  DO UPDATE SET 
    xp_converted = daily_conversion_limits.xp_converted + p_xp_amount,
    coins_received = daily_conversion_limits.coins_received + v_coins_earned,
    updated_at = now();

  -- Log the conversion
  INSERT INTO xp_conversion_log (usuario_id, xp_gasto, mq_coins_recebidos, taxa_conversao)
  VALUES (p_user_id, p_xp_amount, v_coins_earned, v_rate);

  RETURN jsonb_build_object(
    'success', true,
    'xp_spent', p_xp_amount,
    'coins_earned', v_coins_earned,
    'new_balance', v_profile.mq_coins + v_coins_earned
  );
END;
$$;