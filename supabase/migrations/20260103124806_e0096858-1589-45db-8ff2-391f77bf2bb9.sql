-- Fix: complete_referral_reward function allows privilege escalation
-- Add auth.uid() validation to prevent direct RPC calls from arbitrary users

CREATE OR REPLACE FUNCTION public.complete_referral_reward(p_referred_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $$
DECLARE
  v_referral RECORD;
  v_referrer_completed_count INTEGER;
  v_tier_rewards JSONB;
  v_referrer_xp_reward INTEGER;
  v_referrer_premium_days INTEGER;
  v_referred_xp_reward INTEGER := 100;
  v_new_tier TEXT;
  v_old_tier TEXT;
  v_caller_id UUID;
BEGIN
  -- SECURITY: Get the caller's ID (could be NULL in trigger context)
  v_caller_id := auth.uid();
  
  -- SECURITY: This function should only be called:
  -- 1. By triggers (auth.uid() will be NULL in trigger context)
  -- 2. By the referred user themselves
  -- Direct calls from other users are blocked
  IF v_caller_id IS NOT NULL AND p_referred_user_id != v_caller_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot complete referral rewards for other users';
  END IF;

  -- Find pending referral for this user
  SELECT * INTO v_referral
  FROM public.referrals
  WHERE referred_id = p_referred_user_id
    AND status = 'pending';

  IF v_referral IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_pending_referral');
  END IF;

  -- Get referrer's current completed count (before this one)
  SELECT COUNT(*) INTO v_referrer_completed_count
  FROM public.referrals
  WHERE referrer_id = v_referral.referrer_id
    AND status IN ('completed', 'rewarded');

  -- Get old tier before this referral
  SELECT (public.get_referral_tier(v_referrer_completed_count))->>'tier' INTO v_old_tier;

  -- Get tier-based rewards (counting this new referral)
  SELECT public.get_tier_rewards(v_referrer_completed_count + 1) INTO v_tier_rewards;
  v_referrer_xp_reward := (v_tier_rewards->>'xp_reward')::integer;
  v_referrer_premium_days := (v_tier_rewards->>'premium_days')::integer;

  -- Mark referral as completed
  UPDATE public.referrals
  SET 
    status = 'completed',
    completed_at = now()
  WHERE id = v_referral.id;

  -- Grant XP to referrer
  UPDATE public.profiles
  SET xp = xp + v_referrer_xp_reward
  WHERE id = v_referral.referrer_id;

  -- Record XP history for referrer
  INSERT INTO public.xp_history (user_id, source, source_id, xp_change, xp_before, xp_after, description)
  SELECT 
    v_referral.referrer_id,
    'referral',
    v_referral.id,
    v_referrer_xp_reward,
    xp - v_referrer_xp_reward,
    xp,
    'Referral reward (' || (v_tier_rewards->>'tier') || ' tier) - friend completed transactions'
  FROM public.profiles WHERE id = v_referral.referrer_id;

  -- Grant Premium days to referrer
  UPDATE public.profiles
  SET 
    subscription_plan = 'PREMIUM',
    subscription_started_at = COALESCE(subscription_started_at, now()),
    subscription_expires_at = GREATEST(
      COALESCE(subscription_expires_at, now()),
      now()
    ) + (v_referrer_premium_days || ' days')::interval
  WHERE id = v_referral.referrer_id;

  -- Grant bonus XP to referred user
  UPDATE public.profiles
  SET xp = xp + v_referred_xp_reward
  WHERE id = p_referred_user_id;

  -- Record XP history for referred
  INSERT INTO public.xp_history (user_id, source, source_id, xp_change, xp_before, xp_after, description)
  SELECT 
    p_referred_user_id,
    'referral_bonus',
    v_referral.id,
    v_referred_xp_reward,
    xp - v_referred_xp_reward,
    xp,
    'Welcome bonus - referred by friend'
  FROM public.profiles WHERE id = p_referred_user_id;

  -- Mark as rewarded
  UPDATE public.referrals
  SET 
    status = 'rewarded',
    rewarded_at = now()
  WHERE id = v_referral.id;

  -- Check if tier was upgraded and unlock badge
  SELECT (public.get_referral_tier(v_referrer_completed_count + 1))->>'tier' INTO v_new_tier;
  
  IF v_new_tier != v_old_tier THEN
    -- Unlock the tier badge
    UPDATE public.badges
    SET 
      is_unlocked = true,
      unlocked_at = now()
    WHERE user_id = v_referral.referrer_id
      AND name = 'Referral ' || initcap(v_new_tier);
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'referrer_id', v_referral.referrer_id,
    'referrer_xp', v_referrer_xp_reward,
    'referrer_premium_days', v_referrer_premium_days,
    'referred_xp', v_referred_xp_reward,
    'tier', v_new_tier,
    'tier_upgraded', v_new_tier != v_old_tier
  );
END;
$$;