-- Drop and recreate check_referral_fraud_v2 with whitelist support
DROP FUNCTION IF EXISTS public.check_referral_fraud_v2(UUID, UUID);

CREATE OR REPLACE FUNCTION public.check_referral_fraud_v2(p_referrer_id UUID, p_referred_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_risk_score INTEGER := 0;
  v_risk_level TEXT := 'low';
  v_reasons TEXT[] := ARRAY[]::TEXT[];
  v_referrer_fingerprint RECORD;
  v_referred_fingerprint RECORD;
  v_same_fingerprint INTEGER;
  v_same_ip INTEGER;
  v_same_timezone INTEGER;
  v_same_resolution INTEGER;
  v_similar_user_agent INTEGER;
  v_referrer_suspicious_rate NUMERIC;
  v_referred_transactions RECORD;
  v_transaction_similarity INTEGER;
  v_completion_hours INTEGER;
  v_analysis_details JSONB;
  v_is_ip_whitelisted BOOLEAN := false;
  v_whitelisted_org TEXT;
BEGIN
  -- Get fingerprints
  SELECT * INTO v_referrer_fingerprint 
  FROM user_fingerprints 
  WHERE user_id = p_referrer_id 
  ORDER BY created_at DESC LIMIT 1;
  
  SELECT * INTO v_referred_fingerprint 
  FROM user_fingerprints 
  WHERE user_id = p_referred_id 
  ORDER BY created_at DESC LIMIT 1;

  -- Check if referred user's IP is whitelisted
  IF v_referred_fingerprint.ip_address IS NOT NULL THEN
    SELECT true, organization INTO v_is_ip_whitelisted, v_whitelisted_org
    FROM ip_whitelist
    WHERE ip_address = v_referred_fingerprint.ip_address
      AND is_active = true
    LIMIT 1;
    
    IF v_is_ip_whitelisted THEN
      v_reasons := array_append(v_reasons, 'ip_whitelisted');
    END IF;
  END IF;

  -- ========== FINGERPRINT ANALYSIS ==========
  
  -- Check exact fingerprint match (CRITICAL - same device)
  SELECT COUNT(*) INTO v_same_fingerprint
  FROM user_fingerprints
  WHERE fingerprint_hash = v_referred_fingerprint.fingerprint_hash
    AND user_id = p_referrer_id;
  
  IF v_same_fingerprint > 0 THEN
    v_risk_score := v_risk_score + 25;
    v_reasons := array_append(v_reasons, 'same_device_fingerprint');
  END IF;

  -- Check same IP (only if NOT whitelisted)
  IF NOT COALESCE(v_is_ip_whitelisted, false) THEN
    SELECT COUNT(*) INTO v_same_ip
    FROM user_fingerprints
    WHERE ip_address = v_referred_fingerprint.ip_address
      AND user_id = p_referrer_id
      AND created_at > NOW() - INTERVAL '48 hours';
    
    IF v_same_ip > 0 THEN
      v_risk_score := v_risk_score + 5;
      v_reasons := array_append(v_reasons, 'same_ip_network');
      
      -- Discount if fingerprints are different
      IF v_same_fingerprint = 0 THEN
        v_risk_score := v_risk_score - 5;
        v_reasons := array_append(v_reasons, 'different_devices_same_network');
      END IF;
      
      -- Check similar user-agent combo
      SELECT COUNT(*) INTO v_similar_user_agent
      FROM user_fingerprints
      WHERE user_id = p_referrer_id
        AND v_referred_fingerprint.user_agent IS NOT NULL
        AND user_agent IS NOT NULL
        AND similarity(user_agent, v_referred_fingerprint.user_agent) > 0.8;
      
      IF v_similar_user_agent > 0 THEN
        v_risk_score := v_risk_score + 15;
        v_reasons := array_append(v_reasons, 'same_ip_and_user_agent_combo');
      END IF;
    END IF;
  ELSE
    v_same_ip := 0;
  END IF;

  -- Check same timezone (weak, only with fingerprint match)
  SELECT COUNT(*) INTO v_same_timezone
  FROM user_fingerprints
  WHERE timezone = v_referred_fingerprint.timezone
    AND user_id = p_referrer_id;
  
  IF v_same_timezone > 0 AND v_same_fingerprint > 0 THEN
    v_risk_score := v_risk_score + 3;
    v_reasons := array_append(v_reasons, 'same_timezone');
  END IF;

  -- Check same screen resolution (weak)
  SELECT COUNT(*) INTO v_same_resolution
  FROM user_fingerprints
  WHERE screen_resolution = v_referred_fingerprint.screen_resolution
    AND user_id = p_referrer_id;
  
  IF v_same_resolution > 0 AND v_same_fingerprint > 0 THEN
    v_risk_score := v_risk_score + 2;
    v_reasons := array_append(v_reasons, 'same_screen_resolution');
  END IF;

  -- ========== TRANSACTION PATTERN ANALYSIS ==========
  
  SELECT 
    COUNT(*) as total_count,
    COUNT(DISTINCT date) as unique_days,
    COUNT(DISTINCT category) as unique_categories,
    MIN(created_at) as first_transaction,
    MAX(created_at) as last_transaction,
    EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at)))/3600 as hours_span
  INTO v_referred_transactions
  FROM transactions
  WHERE user_id = p_referred_id;

  -- Transactions too fast
  IF v_referred_transactions.hours_span < 1 AND v_referred_transactions.total_count >= 5 THEN
    v_risk_score := v_risk_score + 15;
    v_reasons := array_append(v_reasons, 'transactions_too_fast');
    
    IF v_same_ip > 0 AND NOT COALESCE(v_is_ip_whitelisted, false) THEN
      v_risk_score := v_risk_score + 10;
      v_reasons := array_append(v_reasons, 'fast_transactions_same_ip_combo');
    END IF;
  END IF;

  -- Round amounts pattern
  SELECT COUNT(*) INTO v_transaction_similarity
  FROM transactions
  WHERE user_id = p_referred_id
    AND amount = ROUND(amount, -1);
  
  IF v_transaction_similarity >= 4 THEN
    v_risk_score := v_risk_score + 10;
    v_reasons := array_append(v_reasons, 'mostly_round_amounts');
  END IF;

  -- Same hour pattern
  SELECT COUNT(DISTINCT EXTRACT(HOUR FROM created_at)) INTO v_transaction_similarity
  FROM transactions
  WHERE user_id = p_referred_id;
  
  IF v_transaction_similarity <= 2 AND v_referred_transactions.total_count >= 5 THEN
    v_risk_score := v_risk_score + 8;
    v_reasons := array_append(v_reasons, 'same_hour_pattern');
  END IF;

  -- Similar descriptions to referrer
  SELECT COUNT(*) INTO v_transaction_similarity
  FROM transactions t1
  WHERE t1.user_id = p_referred_id
    AND EXISTS (
      SELECT 1 FROM transactions t2
      WHERE t2.user_id = p_referrer_id
        AND similarity(t1.description, t2.description) > 0.7
    );
  
  IF v_transaction_similarity >= 3 THEN
    v_risk_score := v_risk_score + 12;
    v_reasons := array_append(v_reasons, 'similar_descriptions_to_referrer');
  END IF;

  -- ========== TIMING ANALYSIS ==========
  
  SELECT EXTRACT(EPOCH FROM (
    (SELECT MIN(created_at) FROM transactions WHERE user_id = p_referred_id) -
    (SELECT created_at FROM profiles WHERE id = p_referred_id)
  ))/3600 INTO v_completion_hours;
  
  IF v_completion_hours IS NOT NULL AND v_completion_hours < 1 THEN
    v_risk_score := v_risk_score + 10;
    v_reasons := array_append(v_reasons, 'completed_too_fast');
  END IF;

  -- ========== REFERRER PATTERN ANALYSIS ==========
  
  SELECT 
    CASE 
      WHEN COUNT(*) = 0 THEN 0
      ELSE COUNT(*) FILTER (WHERE flagged_as_suspicious = true)::NUMERIC / COUNT(*)::NUMERIC
    END INTO v_referrer_suspicious_rate
  FROM referrals
  WHERE referrer_id = p_referrer_id;
  
  IF v_referrer_suspicious_rate > 0.3 THEN
    v_risk_score := v_risk_score + 15;
    v_reasons := array_append(v_reasons, 'referrer_high_suspicious_rate');
  END IF;

  -- ========== DETERMINE RISK LEVEL ==========
  
  IF v_risk_score >= 50 THEN
    v_risk_level := 'critical';
  ELSIF v_risk_score >= 35 THEN
    v_risk_level := 'high';
  ELSIF v_risk_score >= 20 THEN
    v_risk_level := 'medium';
  ELSE
    v_risk_level := 'low';
  END IF;

  -- Build analysis details
  v_analysis_details := jsonb_build_object(
    'fingerprint_analysis', jsonb_build_object(
      'same_fingerprint', v_same_fingerprint > 0,
      'same_ip', v_same_ip > 0,
      'ip_whitelisted', COALESCE(v_is_ip_whitelisted, false),
      'whitelisted_organization', v_whitelisted_org,
      'same_timezone', v_same_timezone > 0,
      'same_resolution', v_same_resolution > 0
    ),
    'transaction_analysis', jsonb_build_object(
      'total_transactions', v_referred_transactions.total_count,
      'unique_days', v_referred_transactions.unique_days,
      'unique_categories', v_referred_transactions.unique_categories,
      'hours_span', v_referred_transactions.hours_span
    ),
    'timing_analysis', jsonb_build_object(
      'completion_hours', v_completion_hours
    ),
    'referrer_analysis', jsonb_build_object(
      'suspicious_rate', v_referrer_suspicious_rate
    )
  );

  -- Store the analysis
  INSERT INTO referral_fraud_analysis (
    referrer_id,
    referred_id,
    risk_score,
    risk_level,
    analysis_details
  ) VALUES (
    p_referrer_id,
    p_referred_id,
    v_risk_score,
    v_risk_level,
    v_analysis_details
  )
  ON CONFLICT (referred_id) DO UPDATE SET
    risk_score = v_risk_score,
    risk_level = v_risk_level,
    analysis_details = v_analysis_details;

  RETURN json_build_object(
    'risk_score', v_risk_score,
    'risk_level', v_risk_level,
    'reasons', v_reasons,
    'is_suspicious', v_risk_score >= 35,
    'ip_whitelisted', COALESCE(v_is_ip_whitelisted, false),
    'whitelisted_organization', v_whitelisted_org,
    'details', v_analysis_details
  );
END;
$$;

-- Admin functions for whitelist management
CREATE OR REPLACE FUNCTION public.admin_get_ip_whitelist()
RETURNS TABLE (
  id UUID,
  ip_address TEXT,
  description TEXT,
  organization TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  RETURN QUERY
  SELECT 
    w.id,
    w.ip_address,
    w.description,
    w.organization,
    w.created_by,
    w.created_at,
    w.is_active
  FROM ip_whitelist w
  ORDER BY w.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_add_ip_whitelist(
  p_ip_address TEXT,
  p_description TEXT DEFAULT NULL,
  p_organization TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  INSERT INTO ip_whitelist (ip_address, description, organization, created_by)
  VALUES (p_ip_address, p_description, p_organization, auth.uid())
  RETURNING id INTO v_id;
  
  INSERT INTO admin_logs (admin_id, action_type, details)
  VALUES (auth.uid(), 'add_ip_whitelist', jsonb_build_object(
    'ip_address', p_ip_address,
    'organization', p_organization
  ));
  
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_remove_ip_whitelist(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ip TEXT;
BEGIN
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  SELECT ip_address INTO v_ip FROM ip_whitelist WHERE id = p_id;
  
  DELETE FROM ip_whitelist WHERE id = p_id;
  
  INSERT INTO admin_logs (admin_id, action_type, details)
  VALUES (auth.uid(), 'remove_ip_whitelist', jsonb_build_object('ip_address', v_ip));
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_toggle_ip_whitelist(p_id UUID, p_is_active BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  UPDATE ip_whitelist SET is_active = p_is_active WHERE id = p_id;
END;
$$;