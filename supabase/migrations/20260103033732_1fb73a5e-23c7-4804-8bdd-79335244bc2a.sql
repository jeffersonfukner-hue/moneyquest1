-- Create function to manually link a referral (for admin use)
CREATE OR REPLACE FUNCTION public.admin_link_referral_manually(
  p_referred_id UUID,
  p_referrer_id UUID,
  p_note TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_code TEXT;
  v_existing_referral UUID;
  v_transaction_count INT;
  v_validation_result JSON;
  v_tier_rewards JSON;
  v_completed_count INT;
BEGIN
  -- Check admin permission
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Check if referred user already has a referral
  SELECT id INTO v_existing_referral
  FROM referrals
  WHERE referred_id = p_referred_id;
  
  IF v_existing_referral IS NOT NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'user_already_referred',
      'message', 'Este usuário já possui um registro de referral'
    );
  END IF;

  -- Get referrer's code
  SELECT referral_code INTO v_referrer_code
  FROM profiles
  WHERE id = p_referrer_id;
  
  IF v_referrer_code IS NULL THEN
    v_referrer_code := LEFT(p_referrer_id::TEXT, 8);
  END IF;

  -- Update referred user's profile
  UPDATE profiles
  SET referred_by = p_referrer_id
  WHERE id = p_referred_id;

  -- Create referral record
  INSERT INTO referrals (referrer_id, referred_id, referral_code, status)
  VALUES (p_referrer_id, p_referred_id, v_referrer_code, 'pending');

  -- Check transaction count
  SELECT COUNT(*) INTO v_transaction_count
  FROM transactions
  WHERE user_id = p_referred_id;

  -- Log the action
  INSERT INTO admin_logs (admin_id, action_type, target_user_id, details, note)
  VALUES (
    auth.uid(),
    'manual_referral_link',
    p_referred_id,
    json_build_object(
      'referrer_id', p_referrer_id,
      'transaction_count', v_transaction_count
    ),
    p_note
  );

  -- If user has 5+ transactions, validate and complete
  IF v_transaction_count >= 5 THEN
    -- Run validation
    SELECT validate_referral_transactions_v2(p_referred_id) INTO v_validation_result;
    
    IF (v_validation_result->>'is_valid')::BOOLEAN THEN
      -- Complete the referral
      UPDATE referrals
      SET status = 'completed', completed_at = NOW()
      WHERE referred_id = p_referred_id;

      -- Get completed count for tier
      SELECT COUNT(*) INTO v_completed_count
      FROM referrals
      WHERE referrer_id = p_referrer_id AND status = 'completed';

      -- Get tier rewards
      SELECT get_tier_rewards(v_completed_count) INTO v_tier_rewards;

      -- Apply XP reward to referrer
      UPDATE profiles
      SET xp = xp + (v_tier_rewards->>'xp_reward')::INT
      WHERE id = p_referrer_id;

      -- Apply premium days to referrer
      UPDATE profiles
      SET 
        subscription_plan = 'PREMIUM',
        subscription_expires_at = COALESCE(subscription_expires_at, NOW()) + ((v_tier_rewards->>'premium_days')::INT || ' days')::INTERVAL
      WHERE id = p_referrer_id;

      -- Mark as rewarded
      UPDATE referrals
      SET rewarded_at = NOW()
      WHERE referred_id = p_referred_id;

      RETURN json_build_object(
        'success', true,
        'status', 'completed_with_reward',
        'transaction_count', v_transaction_count,
        'xp_reward', (v_tier_rewards->>'xp_reward')::INT,
        'premium_days', (v_tier_rewards->>'premium_days')::INT,
        'tier', v_tier_rewards->>'tier_name'
      );
    ELSE
      -- Mark as suspicious if validation failed
      UPDATE referrals
      SET 
        flagged_as_suspicious = true,
        suspicion_reason = 'manual_link_validation_failed'
      WHERE referred_id = p_referred_id;

      RETURN json_build_object(
        'success', true,
        'status', 'pending_suspicious',
        'transaction_count', v_transaction_count,
        'validation_issues', v_validation_result->'issues',
        'message', 'Referral criado mas marcado como suspeito devido à validação das transações'
      );
    END IF;
  END IF;

  RETURN json_build_object(
    'success', true,
    'status', 'pending',
    'transaction_count', v_transaction_count,
    'message', 'Referral vinculado com sucesso. Aguardando usuário completar 5 transações válidas.'
  );
END;
$$;