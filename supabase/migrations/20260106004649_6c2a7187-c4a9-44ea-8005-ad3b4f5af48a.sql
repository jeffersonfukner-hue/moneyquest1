
-- Create table to track daily conversion limits
CREATE TABLE IF NOT EXISTS public.daily_conversion_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  conversion_date DATE NOT NULL DEFAULT CURRENT_DATE,
  xp_converted INTEGER NOT NULL DEFAULT 0,
  coins_received INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, conversion_date)
);

-- Enable RLS
ALTER TABLE public.daily_conversion_limits ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own conversion limits"
  ON public.daily_conversion_limits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversion limits"
  ON public.daily_conversion_limits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversion limits"
  ON public.daily_conversion_limits FOR UPDATE
  USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_daily_conversion_limits_user_date ON public.daily_conversion_limits(user_id, conversion_date);

-- Drop existing function to recreate with new logic
DROP FUNCTION IF EXISTS public.convert_xp_to_coins(UUID, INTEGER);

-- Create improved conversion function with tiered rates and limits
CREATE OR REPLACE FUNCTION public.convert_xp_to_coins(
  p_user_id UUID,
  p_xp_amount INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_level INTEGER;
  v_is_premium BOOLEAN;
  v_xp_conversivel INTEGER;
  v_xp_rate INTEGER;
  v_coins_earned INTEGER;
  v_boost_multiplier NUMERIC := 1.0;
  v_daily_limit INTEGER;
  v_daily_converted INTEGER;
  v_remaining_daily INTEGER;
  v_actual_xp_to_convert INTEGER;
  v_premium_bonus NUMERIC := 1.0;
BEGIN
  -- Get user info
  SELECT 
    level, 
    xp_conversivel,
    CASE 
      WHEN subscription_plan = 'PREMIUM' 
        OR premium_override = 'force_on'
        OR (trial_end_date IS NOT NULL AND trial_end_date > now())
      THEN true 
      ELSE false 
    END
  INTO v_user_level, v_xp_conversivel, v_is_premium
  FROM profiles
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'user_not_found');
  END IF;
  
  -- Validate XP amount
  IF p_xp_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'invalid_amount');
  END IF;
  
  IF p_xp_amount > v_xp_conversivel THEN
    RETURN json_build_object('success', false, 'error', 'insufficient_xp', 'available', v_xp_conversivel);
  END IF;
  
  -- Determine conversion rate based on level tier
  -- Premium always gets best rate (8 XP = 1 coin)
  IF v_is_premium THEN
    v_xp_rate := 8;
  ELSIF v_user_level >= 15 THEN
    -- Advanced (level 15+): 8 XP = 1 coin
    v_xp_rate := 8;
  ELSIF v_user_level >= 5 THEN
    -- Intermediate (level 5-14): 10 XP = 1 coin
    v_xp_rate := 10;
  ELSE
    -- Beginner (level 1-4): 15 XP = 1 coin
    v_xp_rate := 15;
  END IF;
  
  -- Set daily limit based on tier
  IF v_is_premium THEN
    v_daily_limit := 10000; -- Premium: 10000 XP/day
  ELSIF v_user_level >= 15 THEN
    v_daily_limit := 5000; -- Advanced: 5000 XP/day
  ELSIF v_user_level >= 5 THEN
    v_daily_limit := 2000; -- Intermediate: 2000 XP/day
  ELSE
    v_daily_limit := 500; -- Beginner: 500 XP/day
  END IF;
  
  -- Check for active conversion boost
  SELECT COALESCE(MAX(valor), 1.0)
  INTO v_boost_multiplier
  FROM active_effects
  WHERE usuario_id = p_user_id
    AND tipo_efeito = 'boost_conversao'
    AND ativo = true
    AND (data_expiracao IS NULL OR data_expiracao > now());
  
  -- Get today's conversion total
  SELECT COALESCE(xp_converted, 0)
  INTO v_daily_converted
  FROM daily_conversion_limits
  WHERE user_id = p_user_id AND conversion_date = CURRENT_DATE;
  
  IF NOT FOUND THEN
    v_daily_converted := 0;
  END IF;
  
  -- Calculate remaining daily allowance
  v_remaining_daily := v_daily_limit - v_daily_converted;
  
  IF v_remaining_daily <= 0 THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'daily_limit_reached', 
      'limit', v_daily_limit,
      'converted_today', v_daily_converted
    );
  END IF;
  
  -- Cap conversion to daily limit
  v_actual_xp_to_convert := LEAST(p_xp_amount, v_remaining_daily);
  
  -- Calculate coins with boost
  v_coins_earned := FLOOR((v_actual_xp_to_convert::NUMERIC / v_xp_rate) * v_boost_multiplier);
  
  -- Ensure at least 1 coin if converting enough XP
  IF v_coins_earned = 0 AND v_actual_xp_to_convert >= v_xp_rate THEN
    v_coins_earned := 1;
  END IF;
  
  IF v_coins_earned = 0 THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'insufficient_xp_for_coin', 
      'required', v_xp_rate,
      'provided', v_actual_xp_to_convert
    );
  END IF;
  
  -- Update user profile (xp_conversivel and mq_coins only)
  UPDATE profiles
  SET 
    xp_conversivel = xp_conversivel - v_actual_xp_to_convert,
    mq_coins = mq_coins + v_coins_earned,
    updated_at = now()
  WHERE id = p_user_id;
  
  -- Update or insert daily limit tracking
  INSERT INTO daily_conversion_limits (user_id, conversion_date, xp_converted, coins_received)
  VALUES (p_user_id, CURRENT_DATE, v_actual_xp_to_convert, v_coins_earned)
  ON CONFLICT (user_id, conversion_date) 
  DO UPDATE SET 
    xp_converted = daily_conversion_limits.xp_converted + v_actual_xp_to_convert,
    coins_received = daily_conversion_limits.coins_received + v_coins_earned,
    updated_at = now();
  
  -- Log the conversion
  INSERT INTO xp_conversion_log (user_id, xp_gasto, mq_coins_recebidos)
  VALUES (p_user_id, v_actual_xp_to_convert, v_coins_earned);
  
  RETURN json_build_object(
    'success', true,
    'xp_spent', v_actual_xp_to_convert,
    'coins_earned', v_coins_earned,
    'rate', v_xp_rate,
    'boost_applied', v_boost_multiplier,
    'daily_remaining', v_remaining_daily - v_actual_xp_to_convert,
    'daily_limit', v_daily_limit,
    'is_premium', v_is_premium
  );
END;
$$;

-- Update add_user_xp to give premium users +20% xp_conversivel
DROP FUNCTION IF EXISTS public.add_user_xp(UUID, INTEGER);

CREATE OR REPLACE FUNCTION public.add_user_xp(
  p_user_id UUID,
  p_xp_amount INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_premium BOOLEAN;
  v_xp_conversivel_bonus INTEGER;
BEGIN
  -- Check if user is premium
  SELECT 
    CASE 
      WHEN subscription_plan = 'PREMIUM' 
        OR premium_override = 'force_on'
        OR (trial_end_date IS NOT NULL AND trial_end_date > now())
      THEN true 
      ELSE false 
    END
  INTO v_is_premium
  FROM profiles
  WHERE id = p_user_id;
  
  -- Premium users get +20% xp_conversivel
  IF v_is_premium THEN
    v_xp_conversivel_bonus := CEIL(p_xp_amount * 1.2);
  ELSE
    v_xp_conversivel_bonus := p_xp_amount;
  END IF;
  
  -- Update both xp (total) and xp_conversivel
  UPDATE profiles
  SET 
    xp = xp + p_xp_amount,
    xp_conversivel = xp_conversivel + v_xp_conversivel_bonus,
    updated_at = now()
  WHERE id = p_user_id;
END;
$$;

-- Function to get user conversion info
CREATE OR REPLACE FUNCTION public.get_conversion_info(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_level INTEGER;
  v_is_premium BOOLEAN;
  v_xp_conversivel INTEGER;
  v_xp_rate INTEGER;
  v_daily_limit INTEGER;
  v_daily_converted INTEGER;
  v_boost_multiplier NUMERIC := 1.0;
BEGIN
  -- Get user info
  SELECT 
    level, 
    xp_conversivel,
    CASE 
      WHEN subscription_plan = 'PREMIUM' 
        OR premium_override = 'force_on'
        OR (trial_end_date IS NOT NULL AND trial_end_date > now())
      THEN true 
      ELSE false 
    END
  INTO v_user_level, v_xp_conversivel, v_is_premium
  FROM profiles
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'user_not_found');
  END IF;
  
  -- Determine rate
  IF v_is_premium THEN
    v_xp_rate := 8;
  ELSIF v_user_level >= 15 THEN
    v_xp_rate := 8;
  ELSIF v_user_level >= 5 THEN
    v_xp_rate := 10;
  ELSE
    v_xp_rate := 15;
  END IF;
  
  -- Set daily limit
  IF v_is_premium THEN
    v_daily_limit := 10000;
  ELSIF v_user_level >= 15 THEN
    v_daily_limit := 5000;
  ELSIF v_user_level >= 5 THEN
    v_daily_limit := 2000;
  ELSE
    v_daily_limit := 500;
  END IF;
  
  -- Get today's usage
  SELECT COALESCE(xp_converted, 0)
  INTO v_daily_converted
  FROM daily_conversion_limits
  WHERE user_id = p_user_id AND conversion_date = CURRENT_DATE;
  
  IF NOT FOUND THEN
    v_daily_converted := 0;
  END IF;
  
  -- Check for boost
  SELECT COALESCE(MAX(valor), 1.0)
  INTO v_boost_multiplier
  FROM active_effects
  WHERE usuario_id = p_user_id
    AND tipo_efeito = 'boost_conversao'
    AND ativo = true
    AND (data_expiracao IS NULL OR data_expiracao > now());
  
  RETURN json_build_object(
    'success', true,
    'xp_conversivel', v_xp_conversivel,
    'rate', v_xp_rate,
    'daily_limit', v_daily_limit,
    'daily_converted', v_daily_converted,
    'daily_remaining', v_daily_limit - v_daily_converted,
    'boost_active', v_boost_multiplier > 1.0,
    'boost_multiplier', v_boost_multiplier,
    'is_premium', v_is_premium,
    'tier', CASE 
      WHEN v_is_premium THEN 'premium'
      WHEN v_user_level >= 15 THEN 'advanced'
      WHEN v_user_level >= 5 THEN 'intermediate'
      ELSE 'beginner'
    END
  );
END;
$$;
